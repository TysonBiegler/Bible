let bibleData = {};

fetch("bible_data.json")
  .then((response) => response.json())
  .then((data) => {
    bibleData = data;
    console.log("Bible data loaded successfully");
    window.bibleData = bibleData;
    window.dispatchEvent(new Event("bibleDataLoaded"));
  })
  .catch((error) => {
    console.error("Error loading Bible data:", error);
    window.dispatchEvent(new Event("bibleDataFailed"));
  });
