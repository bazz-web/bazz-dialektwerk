<?php

define( 'pdoHost',      '4m399s.myd.infomaniak.com' );
define( 'pdoUsername',  '4m399s_php' );
define( 'pdoPassword',  'phpDataData62!' );
define( 'pdoDefaultDB', '4m399s_dialektwerk' );

$dsn     = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', pdoHost, pdoDefaultDB);
$options = [ PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
             PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
             PDO::ATTR_EMULATE_PREPARES   => false,
           ];
           
$pdo = new PDO($dsn, pdoUsername, pdoPassword, $options);

?>