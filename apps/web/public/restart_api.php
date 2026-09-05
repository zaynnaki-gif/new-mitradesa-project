<?php
$target1 = '/home/u800256894/domains/indigo-barracuda-105731.hostingersite.com/hbuilds/current/nodejs/tmp/restart.txt';
$target2 = '/home/u800256894/domains/indigo-barracuda-105731.hostingersite.com/hbuilds/current/tmp/restart.txt';

if (touch($target1)) {
    echo "Touched $target1<br>";
} else {
    echo "Failed to touch $target1<br>";
}

if (touch($target2)) {
    echo "Touched $target2<br>";
} else {
    echo "Failed to touch $target2<br>";
}

echo "Restart signal sent via touch!";
?>
