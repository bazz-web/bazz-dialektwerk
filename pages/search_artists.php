// javascript
artists = [

<?php
include '../common/pdo.php';

const MAX_RESULTS = 30;
$query = "SELECT artist.id, artist.name, artist.image_url, link.url";
$query = $query." FROM artist JOIN link ON link.artist_id = artist.id AND link.type='youtube_song'";
/*  TODO: add search criterias (dialekt, genre, zuhörer min/max, ...)
if (array_key_exists("dialekt", $_GET)) {
    $dialekt = $_GET["dialekt"];
    $query = $query." WHERE artist.dialekt = '$dialekt%'"
}
*/
$query = $query." LIMIT ".MAX_RESULTS.";";

$stmt = $pdo->prepare($query);
$stmt->execute();
$row_count = $stmt->rowCount();
// TODO: mélanger
do {
    $rowset = $stmt->fetchAll(PDO::FETCH_NUM);
    if ($rowset) {
        foreach ($rowset as $row) {
            $id = $row[0];
            $name = $row[1];
            $image_url = $row[2];
            $youtube_url = $row[3];

            // extract the video id from the url
            $pattern = '/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i';
            if (preg_match($pattern, $youtube_url, $matches)) {
                $youtube_video_id = $matches[1];
            }
            else {
                $youtube_video_id = "";
            }
            
            echo '  {id:'.$id.', name:"'.$name.'", imageURL:"'.$image_url.'", youtubeVideoId:"'.$youtube_video_id.'"},';
        }
    }
} while ($stmt->nextRowset());
?>

];
currentArtist = 0;
