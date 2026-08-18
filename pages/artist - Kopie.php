<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="../common/styles.css">
  <title>Artist</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">

  <?php include '../common/pdo.php';?>
</head>
<body>

<?php
$artist_id = $_REQUEST["id"];
$stmt = $pdo->prepare("SELECT * FROM artist WHERE id=$artist_id");
$stmt->execute();
$artist_row = $stmt->fetch(PDO::FETCH_ASSOC);
$name          = $artist_row["name"];
$region        = $artist_row["region"];

// links
$stmt = $pdo->prepare("SELECT type, url FROM link WHERE artist_id=$artist_id ORDER BY rank");
$stmt->execute();
$link_rowset = $stmt->fetchAll(PDO::FETCH_NUM);

$spotify       = null;
$youtube_song  = null;
?>

<div class="container">

  <div id="title" class="block">
    <div style="display:flex; justify-content:space-between;">
      <h1><?php echo $name;?></h1>
      <p><?php echo $region;?></p>
    </div>
    <div class="links">
<?php
    if ($link_rowset) {
        foreach ($link_rowset as $link_row) {
            $link_type = $link_row[0];
            $link_url  = $link_row[1];
            if ($link_type == "spotify") {
              $spotify = str_replace("intl-de", "embed", $link_url);
              // nothing here, see below
            }
            elseif ($link_type == "youtube_song") {
              $youtube_song = str_replace("https://youtu.be/", "https://www.youtube.com/embed/", $link_url);
              // nothing here, see below
            }
            elseif ($link_type == "email") {
              echo "  <a class=\"email\" href=\"$link_url\">@</a>";
            }
            else {
              echo '  <a class="link-'.$link_type.'" href="'.$link_url.'"><img src="../images/link-'.$link_type.'.png" alt="'.$link_type.'" target="_blank" rel="noopener noreferrer"></a>';
            }
        }
    }
?>
    </div>
  </div>

  <div class="CoverArtBase_coverArt__ne0XI CoverArtTrackList_coverArtTrackList__1YwHX">TEST</div>

<?php
  if ($spotify) {
    echo '<div id="spotify" class="block">';
    echo '  <iframe data-testid="embed-iframe" style="border-radius:12px" src="'.$spotify.'?utm_source=generator" width="100%" height="100%" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>';
    echo '</div>';
  }
?>

<?php
  if ($youtube_song) {
    echo '<div id="youtube" class="block">';
    echo '  <iframe width="560" height="315" src="'.$youtube_song.'" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
    echo '</div>';
  }
?>



</div>

</body>
</html>
