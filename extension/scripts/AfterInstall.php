<?php

class AfterInstall
{
    /**
     * @param object $container
     */
    public function run($container): void
    {
        $config = $container->get('config');

        $config->set('timeZone', 'Asia/Tehran');
        $config->set('weekStart', 6);
        $config->set('dateFormat', 'YYYY/MM/DD');
        $config->save();

        $container->get('dataManager')->clearCache();
    }
}
