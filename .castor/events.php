<?php

use Castor\Attribute\AsTask;
use Symfony\AI\Platform\Bridge\Ollama\Factory as OllamaFactory;
use Symfony\AI\Platform\Message\Message;
use Symfony\AI\Platform\Message\MessageBag;
use Symfony\Component\HttpClient\HttpClient;

use function Castor\io;

#[AsTask(name: 'import', namespace: 'events', description: 'Importe les événements du comité départemental avec Symfony AI et Ollama.')]
function import_events(bool $dryRun = false): void
{
    $sourceUrl = 'https://sites.ffkarate.fr/illeetvilaine/calendrier/';
    $contentPath = dirname(__DIR__).'/src/content/config/events.json';
    $ollamaUrl = getenv('OLLAMA_URL') ?: 'http://127.0.0.1:11434';
    $model = getenv('OLLAMA_MODEL') ?: 'qwen2.5:latest';

    $calendarEvents = [];
    $pages = [$sourceUrl];
    $visited = [];
    $client = HttpClient::create();

    while ($pages !== [] && count($visited) < 10) {
        $pageUrl = array_shift($pages);
        if (isset($visited[$pageUrl])) {
            continue;
        }
        $visited[$pageUrl] = true;

        $html = $client->request('GET', $pageUrl, [
            'headers' => ['User-Agent' => 'ShotokanMontfortEventImporter/1.0'],
            'timeout' => 30,
        ])->getContent();

        $document = new DOMDocument();
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML('<?xml encoding="UTF-8">'.$html);
        libxml_clear_errors();
        libxml_use_internal_errors($previous);

        $xpath = new DOMXPath($document);
        foreach ($xpath->query('//a[@href and (contains(., "202") or contains(., "19"))]') as $link) {
            $label = trim(preg_replace('/\s+/u', ' ', $link->textContent) ?? '');
            if (!preg_match('/\b(?:19|20)\d{2}\b/u', $label)) {
                continue;
            }

            $eventUrl = resolve_event_url($link->getAttribute('href'), $pageUrl);
            if ($eventUrl === null || preg_match('/\.(?:pdf|xlsx?|docx?)(?:$|\?)/i', $eventUrl)) {
                continue;
            }
            $parent = $link->parentNode;
            $context = trim(preg_replace('/\s+/u', ' ', $parent?->textContent ?? $label) ?? $label);
            if (mb_strlen($context) > 600) {
                $context = $label;
            }
            $calendarEvents[$eventUrl] = ['title' => $label, 'context' => $context, 'url' => $eventUrl];
        }

        foreach ($xpath->query('//a[@href and (contains(concat(" ", normalize-space(@class), " "), " page-numbers ") or @rel="next")]') as $link) {
            $href = trim($link->getAttribute('href'));
            if ($href === '') {
                continue;
            }
            $nextUrl = resolve_event_url($href, $pageUrl);
            if ($nextUrl !== null && parse_url($nextUrl, PHP_URL_HOST) === parse_url($sourceUrl, PHP_URL_HOST)
                && str_contains((string) parse_url($nextUrl, PHP_URL_PATH), '/calendrier/')) {
                $pages[] = $nextUrl;
            }
        }
    }

    if ($calendarEvents === []) {
        throw new RuntimeException('Aucun événement daté n’a été trouvé dans la page source.');
    }

    $snippets = [];
    foreach ($calendarEvents as $event) {
        $details = $event['context'];
        try {
            $detailHtml = $client->request('GET', $event['url'], [
                'headers' => ['User-Agent' => 'ShotokanMontfortEventImporter/1.0'],
                'timeout' => 30,
            ])->getContent();

            $detailDocument = new DOMDocument();
            $previous = libxml_use_internal_errors(true);
            $detailDocument->loadHTML('<?xml encoding="UTF-8">'.$detailHtml);
            libxml_clear_errors();
            libxml_use_internal_errors($previous);
            $detailXpath = new DOMXPath($detailDocument);
            $contentNodes = $detailXpath->query('//main | //article | //*[@class and (contains(concat(" ", normalize-space(@class), " "), " entry-content ") or contains(@class, "tribe-events-single"))]');
            $detailText = '';
            foreach ($contentNodes as $contentNode) {
                $candidate = trim(preg_replace('/\s+/u', ' ', $contentNode->textContent) ?? '');
                if (mb_strlen($candidate) > mb_strlen($detailText)) {
                    $detailText = $candidate;
                }
            }
            if ($detailText !== '') {
                $details = mb_substr($detailText, 0, 4000);
            }
        } catch (Throwable $exception) {
            io()->warning(sprintf('Fiche événement inaccessible, utilisation du calendrier : %s', $event['url']));
        }

        $snippets[] = sprintf("Événement : %s\nURL : %s\nTexte : %s", $event['title'], $event['url'], $details);
    }

    $platform = OllamaFactory::createPlatform($ollamaUrl);
    $prompt = <<<PROMPT
Tu extrais les événements sportifs du calendrier du comité départemental d’Ille-et-Vilaine.
Chaque extrait provient de la fiche détaillée de l’événement indiqué. Utilise sa fiche pour compléter les informations, en gardant le titre et la date du calendrier si la fiche ne les précise pas clairement. Retourne uniquement un objet JSON conforme au schéma.
Chaque objet doit contenir les clés category, title, categories, date, time, location, address, audience et price.
category vaut competition, stage ou grade. date est au format YYYY-MM-DD. Pour une information absente, utilise une chaîne vide.
Rédige chaque titre en français naturel et en casse de phrase : seule la première lettre et les noms propres prennent une majuscule. Reformule les intitulés entièrement en majuscules pour les rendre lisibles, sans inventer d’information. Dans les titres, développe toujours « DEP » ou « DÉP. » en « départemental ».
Le champ price contient uniquement un prix ou une mention de gratuité explicitement présents dans la fiche. N’y mets jamais true, false ou une valeur booléenne ; si le prix n’est pas indiqué, retourne une chaîne vide.
Classe les stages et formations comme stage, les coupes, championnats et challenges comme competition, et les examens ou réunions de règlement de grades comme grade. Le mot « kata » ou « kumite » seul ne suffit pas à déterminer la catégorie.
Ne complète pas les informations absentes et ignore les liens de pagination ou éléments qui ne sont pas des événements.
Fiches détaillées :
PROMPT;
    $prompt .= "\n".implode("\n", $snippets);

    $messages = new MessageBag(Message::ofUser($prompt));
    $result = $platform->invoke($model, $messages, [
        'temperature' => 0,
        'response_format' => [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'calendar_events',
                'schema' => [
                    'type' => 'object',
                    'properties' => [
                        'events' => [
                            'type' => 'array',
                            'items' => [
                                'type' => 'object',
                                'properties' => [
                                    'category' => ['type' => 'string', 'enum' => ['competition', 'stage', 'grade']],
                                    'title' => ['type' => 'string'],
                                    'categories' => ['type' => 'string'],
                                    'date' => ['type' => 'string'],
                                    'time' => ['type' => 'string'],
                                    'location' => ['type' => 'string'],
                                    'address' => ['type' => 'string'],
                                    'audience' => ['type' => 'string'],
                                    'price' => ['type' => 'string'],
                                ],
                                'required' => ['category', 'title', 'categories', 'date', 'time', 'location', 'address', 'audience', 'price'],
                                'additionalProperties' => false,
                            ],
                        ],
                    ],
                    'required' => ['events'],
                    'additionalProperties' => false,
                ],
            ],
        ],
    ]);
    $raw = trim($result->asText());
    $raw = preg_replace('/^```(?:json)?\s*|\s*```$/u', '', $raw) ?? $raw;
    try {
        $decoded = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
    } catch (JsonException $exception) {
        throw new RuntimeException(sprintf('Ollama a renvoyé un JSON invalide : %s. Réponse reçue : %s', $exception->getMessage(), mb_substr($raw, 0, 500)), previous: $exception);
    }
    $extracted = $decoded['events'] ?? null;
    if (!is_array($extracted)) {
        throw new RuntimeException('Ollama n’a pas retourné un objet JSON contenant un tableau « events ».');
    }

    $content = json_decode(file_get_contents($contentPath), true, flags: JSON_THROW_ON_ERROR);
    $events = $content['events'];
    $correctedPrices = [];
    foreach ($events as $index => $event) {
        if (normalize_event_field($event['price'] ?? '') === '' && isset($event['price']) && trim((string) $event['price']) !== '') {
            unset($events[$index]['price']);
            $correctedPrices[] = $event['title'];
        }
    }

    $known = [];
    foreach ($events as $index => $event) {
        $known[normalize_event_key($event['title'], $event['date'])] = $index;
    }

    $added = [];
    $correctedCategories = [];
    $enrichedEvents = [];
    foreach ($extracted as $event) {
        if (!is_array($event) || !isset($event['title'], $event['date'], $event['category'])) {
            continue;
        }

        $title = normalize_event_title((string) $event['title']);
        $date = trim((string) $event['date']);
        $category = infer_event_category($title, trim((string) $event['category']));
        if ($title === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date) || !in_array($category, ['competition', 'stage', 'grade'], true)) {
            continue;
        }

        $key = normalize_event_key($title, $date);
        if (isset($known[$key])) {
            $existingIndex = $known[$key];
            if ($events[$existingIndex]['category'] !== $category) {
                $events[$existingIndex]['category'] = $category;
                $correctedCategories[] = ['title' => $title, 'category' => $category];
            }
            foreach (['categories', 'time', 'location', 'address', 'audience', 'price'] as $field) {
                $value = normalize_event_field($event[$field] ?? '');
                if ($value !== '' && normalize_event_field($events[$existingIndex][$field] ?? '') === '') {
                    $events[$existingIndex][$field] = $value;
                    $enrichedEvents[] = ['title' => $title, 'field' => $field];
                }
            }
            continue;
        }

        $addedEvent = [
            'category' => $category,
            'title' => $title,
            'date' => $date,
            'icon' => match ($category) {
                'competition' => 'lucide:trophy',
                'grade' => 'lucide:badge-check',
                default => 'lucide:users',
            },
        ];
        foreach (['categories', 'time', 'location', 'address', 'audience', 'price'] as $field) {
            $value = normalize_event_field($event[$field] ?? '');
            if ($value !== '') {
                $addedEvent[$field] = $value;
            }
        }

        $events[] = $addedEvent;
        $added[] = $addedEvent;
        $known[$key] = array_key_last($events);
    }

    usort($events, static fn (array $a, array $b): int => $a['date'] <=> $b['date']);
    io()->writeln(sprintf('%d nouvel(s) événement(s), %d catégorie(s) corrigée(s), %d champ(s) complété(s), %d faux prix supprimé(s), %d déjà présent(s).', count($added), count($correctedCategories), count($enrichedEvents), count($correctedPrices), max(0, count($extracted) - count($added) - count($correctedCategories))));

    if ($dryRun) {
        io()->writeln(json_encode(['added' => $added, 'correctedCategories' => $correctedCategories, 'enrichedEvents' => $enrichedEvents, 'correctedPrices' => $correctedPrices], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        return;
    }

    if ($added !== [] || $correctedCategories !== [] || $enrichedEvents !== [] || $correctedPrices !== []) {
        $content['events'] = $events;
        file_put_contents($contentPath, json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n");
    }
    io()->success('src/content/config/events.json mis à jour.');
}

function normalize_event_key(string $title, string $date): string
{
    return mb_strtolower(trim(preg_replace('/\s+/u', ' ', $title) ?? $title)).'|'.$date;
}

function normalize_event_field(mixed $value): string
{
    $value = trim((string) $value);
    if (in_array(mb_strtolower($value), ['true', 'false', 'null', 'none', 'n/a'], true)) {
        return '';
    }

    return $value;
}

function resolve_event_url(string $href, string $baseUrl): ?string
{
    $href = trim($href);
    if ($href === '' || str_starts_with($href, '#')) {
        return null;
    }

    $scheme = parse_url($baseUrl, PHP_URL_SCHEME) ?: 'https';
    $baseHost = parse_url($baseUrl, PHP_URL_HOST);
    if (str_starts_with($href, '//')) {
        $url = $scheme.':'.$href;
    } elseif (parse_url($href, PHP_URL_SCHEME)) {
        $url = $href;
    } else {
        $hrefPath = parse_url($href, PHP_URL_PATH) ?? '';
        $basePath = parse_url($baseUrl, PHP_URL_PATH) ?? '/';
        if ($hrefPath === '') {
            $hrefPath = $basePath;
        } elseif (!str_starts_with($hrefPath, '/')) {
            $directory = str_ends_with($basePath, '/') ? $basePath : rtrim(dirname($basePath), '/').'/';
            $hrefPath = $directory.$hrefPath;
        }

        $url = $scheme.'://'.$baseHost.$hrefPath;
        $query = parse_url($href, PHP_URL_QUERY);
        if ($query !== null) {
            $url .= '?'.$query;
        }
        $fragment = parse_url($href, PHP_URL_FRAGMENT);
        if ($fragment !== null) {
            $url .= '#'.$fragment;
        }
    }

    return parse_url($url, PHP_URL_HOST) === $baseHost ? $url : null;
}

function normalize_event_title(string $title): string
{
    $title = trim(preg_replace('/\s+/u', ' ', $title) ?? $title);
    if ($title !== '' && mb_strtoupper($title) === $title) {
        $title = mb_strtolower($title);
        $title = mb_strtoupper(mb_substr($title, 0, 1)).mb_substr($title, 1);
    }
    $title = preg_replace('/\b(?:dép|dep)\.?(?=\s|$)/iu', 'départemental', $title) ?? $title;

    return $title;
}

function infer_event_category(string $title, string $fallback): string
{
    $title = mb_strtolower($title);

    if (preg_match('/\b(stage|formation)\b/u', $title)) {
        return 'stage';
    }
    if (preg_match('/\b(coupe|championnat|challenge|compétition|competition|kumite)\b/u', $title)) {
        return 'competition';
    }
    if (preg_match('/\b(grade|examen|passage)\b/u', $title)) {
        return 'grade';
    }

    return in_array($fallback, ['competition', 'stage', 'grade'], true) ? $fallback : 'stage';
}
