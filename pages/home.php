<!DOCTYPE html>
<html>
<head>
	<link rel="stylesheet" href="../common/styles.css">
	<title>Artists</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

	<?php include '../common/pdo.php';?>
</head>
<body>

<?php
const MAX_RESULTS = 30;
if (array_key_exists("q", $_GET)) {
    $q = $_GET["q"];
	$stmt = $pdo->prepare("SELECT artist.id, artist.name, artist.image_url FROM artist WHERE artist.name LIKE '$q%' ORDER BY artist.name LIMIT ".MAX_RESULTS);
} else {
    $q = "";
	$stmt = $pdo->prepare("SELECT artist.id, artist.name, artist.image_url FROM artist ORDER BY artist.id LIMIT ".MAX_RESULTS);
}
?>

<h1>Dialektwerk</h1>
<p>Die Schweizer Mundart Datenbank</p>

<form method="get" action="<?php echo $_SERVER['PHP_SELF'];?>">
	<input type="text" name="q" value="<?php echo $q;?>">
	<input type="submit">
</form>

<div class="artist-container">

<?php
$stmt->execute();
$row_count = $stmt->rowCount();

do {
    $rowset = $stmt->fetchAll(PDO::FETCH_NUM);
    if ($rowset) {
        foreach ($rowset as $row) {
            $id = $row[0];
            $name = $row[1];
            $image_url = $row[2];
            echo "<a id=\"artist$id\" class=\"artist\" href=\"artist.php?id=$id\">";
            echo "  <div>";
            echo '      <image class="clippy" src="'.$image_url.'"></image>';
            
            echo "      <div>";
            echo        $name;
            echo "      </div>";
            echo "  </div>";
            echo "</a>";
        }
    }
} while ($stmt->nextRowset());

if ($row_count == MAX_RESULTS) {
    echo "<div class=\"artist\">und mehr ...</div>";
}

if ($row_count == 0) {
    echo "<div class=\"artist\">leider kein Treffer</div>";
}
?>

</div>

</body>
</html>

