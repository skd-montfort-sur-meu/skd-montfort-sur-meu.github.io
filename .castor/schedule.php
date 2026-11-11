<?php

use Castor\Attribute\AsTask;

use function Castor\context;
use function Castor\io;
use function Castor\run;

const EVENTS_SCHEDULE_LABEL = 'fr.skdmontfort.events-import';

#[AsTask(name: 'schedule', namespace: 'events', description: 'Planifie l’import des événements chaque vendredi à 12h (macOS, launchd) avec ouverture d’une PR.')]
function schedule_events(): void
{
    ensure_macos();

    $repo = dirname(__DIR__);
    $home = (string) getenv('HOME');
    $script = $home.'/.local/bin/skd-events-import';
    $plist = events_schedule_plist_path();
    $log = $home.'/Library/Logs/skd-events-import.log';

    // Le script est copié hors du dépôt : la tâche tourne toujours sur la version installée,
    // quelle que soit la branche en cours dans le checkout de travail.
    @mkdir(dirname($script), 0755, true);
    copy($repo.'/scripts/import-events-pr.sh', $script);
    chmod($script, 0755);

    $template = (string) file_get_contents($repo.'/scripts/launchd/'.EVENTS_SCHEDULE_LABEL.'.plist');
    @mkdir(dirname($plist), 0755, true);
    file_put_contents($plist, strtr($template, [
        '{{SCRIPT}}' => htmlspecialchars($script, ENT_XML1),
        '{{REPO}}' => htmlspecialchars($repo, ENT_XML1),
        '{{LOG}}' => htmlspecialchars($log, ENT_XML1),
    ]));

    $domain = 'gui/'.posix_getuid();
    run(['launchctl', 'bootout', $domain.'/'.EVENTS_SCHEDULE_LABEL], context()->withAllowFailure()->withQuiet());
    run(['launchctl', 'bootstrap', $domain, $plist]);

    io()->success([
        'Import planifié chaque vendredi à 12h.',
        sprintf('Script : %s', $script),
        sprintf('Logs : %s', $log),
        sprintf('Lancer maintenant : launchctl kickstart %s/%s', $domain, EVENTS_SCHEDULE_LABEL),
    ]);
}

#[AsTask(name: 'unschedule', namespace: 'events', description: 'Supprime la planification hebdomadaire de l’import des événements.')]
function unschedule_events(): void
{
    ensure_macos();

    run(['launchctl', 'bootout', 'gui/'.posix_getuid().'/'.EVENTS_SCHEDULE_LABEL], context()->withAllowFailure()->withQuiet());
    @unlink(events_schedule_plist_path());
    @unlink(getenv('HOME').'/.local/bin/skd-events-import');

    io()->success('Planification supprimée.');
}

function events_schedule_plist_path(): string
{
    return getenv('HOME').'/Library/LaunchAgents/'.EVENTS_SCHEDULE_LABEL.'.plist';
}

function ensure_macos(): void
{
    if (PHP_OS_FAMILY !== 'Darwin') {
        throw new RuntimeException('La planification utilise launchd et n’est disponible que sur macOS.');
    }
}
