<?php
$target1 = '/home/u800256894/domains/indigo-barracuda-105731.hostingersite.com/hbuilds/current/nodejs/tmp/restart.txt';
$target2 = '/home/u800256894/domains/indigo-barracuda-105731.hostingersite.com/hbuilds/current/tmp/restart.txt';
@touch($target1);
@touch($target2);
exec("pgrep -u u800256894 -f 'domains/indigo-barracuda' | xargs kill -9 2>/dev/null");
echo "Restart signal sent!";
?>
