function BibleApp() {
  const [bibleData, setBibleData] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentBook, setCurrentBook] = React.useState("");
  const [currentChapter, setCurrentChapter] = React.useState("1");
  const [currentVerse, setCurrentVerse] = React.useState("1");
  const [currentPage, setCurrentPage] = React.useState(0);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isChapterSelectorOpen, setIsChapterSelectorOpen] =
    React.useState(false);
  const [selectedVerses, setSelectedVerses] = React.useState([]);
  const [shareMessage, setShareMessage] = React.useState("");
  const versesPerPage = 5;

  React.useEffect(() => {
    const handleDataLoaded = () => {
      setBibleData(window.bibleData);
      setIsLoading(false);
      const firstBook = Object.keys(window.bibleData)[0];
      setCurrentBook(firstBook);
      setCurrentChapter(Object.keys(window.bibleData[firstBook])[0]);
    };

    const handleDataFailed = () => {
      setIsLoading(false);
      console.error("Failed to load Bible data");
    };

    window.addEventListener("bibleDataLoaded", handleDataLoaded);
    window.addEventListener("bibleDataFailed", handleDataFailed);

    return () => {
      window.removeEventListener("bibleDataLoaded", handleDataLoaded);
      window.removeEventListener("bibleDataFailed", handleDataFailed);
    };
  }, []);

  const handleKeyDown = React.useCallback(
    (e) => {
      if (e.key === "ArrowDown" || e.key === "2") {
        e.preventDefault();
        setCurrentPage((prevPage) => {
          const nextPage = prevPage + 1;
          const maxPage =
            Math.ceil(
              Object.keys(bibleData[currentBook][currentChapter]).length /
                versesPerPage
            ) - 1;
          return Math.min(nextPage, maxPage);
        });
      } else if (e.key === "ArrowUp" || e.key === "8") {
        e.preventDefault();
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 0));
      } else if (e.key === "SoftLeft" || e.key === "4") {
        setIsMenuOpen(true);
      } else if (e.key === "SoftRight" || e.key === "6") {
        setIsSearchOpen(true);
      }
    },
    [currentBook, currentChapter, bibleData]
  );

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const toggleVerseSelection = (verse) => {
    setSelectedVerses((prevSelected) => {
      if (prevSelected.includes(verse)) {
        return prevSelected.filter((v) => v !== verse);
      } else {
        return [...prevSelected, verse].sort(
          (a, b) => parseInt(a) - parseInt(b)
        );
      }
    });
  };

  const chapterText = React.useMemo(() => {
    if (isLoading || !bibleData || !currentBook || !currentChapter) {
      return [];
    }
    if (!bibleData[currentBook] || !bibleData[currentBook][currentChapter]) {
      console.error("Invalid book or chapter:", currentBook, currentChapter);
      return [];
    }
    const verses = Object.entries(bibleData[currentBook][currentChapter]);
    const pageVerses = verses.slice(
      currentPage * versesPerPage,
      (currentPage + 1) * versesPerPage
    );
    return pageVerses.map(([verse, text]) =>
      React.createElement(
        "p",
        {
          key: verse,
          "data-verse": verse,
          onClick: () => toggleVerseSelection(verse),
          className: selectedVerses.includes(verse) ? "selected" : "",
        },
        React.createElement("strong", null, verse + ". "),
        text
      )
    );
  }, [
    isLoading,
    bibleData,
    currentBook,
    currentChapter,
    currentPage,
    selectedVerses,
  ]);

  const handleMenuSelect = (book, chapter) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setCurrentPage(0);
    setSelectedVerses([]);
    setIsMenuOpen(false);
  };

  const handleSearchResult = (book, chapter, verse) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setCurrentVerse(verse);
    setCurrentPage(Math.floor((parseInt(verse) - 1) / versesPerPage));
    setSelectedVerses([]);
    setIsSearchOpen(false);
  };

  const handleCurrentBookClick = () => {
    setIsChapterSelectorOpen(true);
  };

  const handleChapterSelect = (chapter) => {
    setCurrentChapter(chapter);
    setCurrentPage(0);
    setSelectedVerses([]);
    setIsChapterSelectorOpen(false);
  };

  const handleShare = () => {
    if (selectedVerses.length === 0) return;

    const verseTexts = selectedVerses
      .map((verse) => {
        const text = bibleData[currentBook][currentChapter][verse];
        return `**${verse}.** ${text}`;
      })
      .join("\n");

    const reference = `${currentBook} ${currentChapter}:${selectedVerses[0]}${
      selectedVerses.length > 1
        ? "-" + selectedVerses[selectedVerses.length - 1]
        : ""
    }`;

    const appLink =
      "Download the bible app here --> [https://your-kaios-bible-app-link.com]"; // Replace with your actual app link
    const shareText = `"${verseTexts}"\n${reference}\n\n${appLink}`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareText)
      .then(() => {
        setShareMessage("Copied to clipboard");
        setTimeout(() => setShareMessage(""), 2000); // Clear message after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        setShareMessage("Failed to copy");
        setTimeout(() => setShareMessage(""), 2000);
      });
  };

  if (isLoading) {
    return React.createElement("div", null, "Loading Bible data...");
  }

  if (!bibleData || Object.keys(bibleData).length === 0) {
    return React.createElement(
      "div",
      null,
      "No Bible data available. Please check your data source."
    );
  }

  return React.createElement(
    "div",
    { className: "app-container" },
    React.createElement(
      "div",
      { className: "header" },
      React.createElement("span", null, "KaiOS Bible App")
    ),
    React.createElement(
      "div",
      { className: "content" },
      chapterText.length > 0
        ? chapterText
        : React.createElement("p", null, "No verses found for this chapter.")
    ),
    React.createElement(
      "div",
      { className: "footer" },
      React.createElement(
        "span",
        { onClick: () => setIsMenuOpen(true) },
        "Menu"
      ),
      React.createElement(
        "span",
        {
          onClick: handleCurrentBookClick,
          style: { cursor: "pointer" },
        },
        `${currentBook} ${currentChapter}:${currentVerse}`
      ),
      selectedVerses.length > 0
        ? React.createElement(
            "span",
            { onClick: handleShare },
            shareMessage || "Share"
          )
        : React.createElement(
            "span",
            { onClick: () => setIsSearchOpen(true) },
            "Search"
          )
    ),
    isMenuOpen &&
      React.createElement(Menu, {
        bibleData: bibleData,
        onSelect: handleMenuSelect,
        onClose: () => setIsMenuOpen(false),
      }),
    isSearchOpen &&
      React.createElement(SearchMenu, {
        bibleData: bibleData,
        onSearchResult: handleSearchResult,
        onClose: () => setIsSearchOpen(false),
      }),
    isChapterSelectorOpen &&
      React.createElement(ChapterSelector, {
        book: currentBook,
        chapters: Object.keys(bibleData[currentBook]),
        onSelect: handleChapterSelect,
        onClose: () => setIsChapterSelectorOpen(false),
      })
  );
}

function Menu({ bibleData, onSelect, onClose }) {
  const [selectedBook, setSelectedBook] = React.useState(null);
  const bookList = Object.keys(bibleData);

  const handleBookSelect = (book) => {
    setSelectedBook(book);
  };

  const handleChapterSelect = (chapter) => {
    onSelect(selectedBook, chapter);
  };

  if (selectedBook) {
    const chapters = Object.keys(bibleData[selectedBook]);
    return React.createElement(
      "div",
      { className: "menu" },
      React.createElement(
        "div",
        { className: "menu-header" },
        React.createElement(
          "button",
          { onClick: () => setSelectedBook(null) },
          "Back"
        ),
        React.createElement("span", null, `Chapters of ${selectedBook}`)
      ),
      React.createElement(
        "div",
        { className: "menu-content" },
        chapters.map((chapter) =>
          React.createElement(
            "div",
            {
              key: chapter,
              className: "menu-item",
              onClick: () => handleChapterSelect(chapter),
            },
            `Chapter ${chapter}`
          )
        )
      )
    );
  }

  return React.createElement(
    "div",
    { className: "menu" },
    React.createElement(
      "div",
      { className: "menu-header" },
      React.createElement("button", { onClick: onClose }, "Close"),
      React.createElement("span", null, "Books of the Bible")
    ),
    React.createElement(
      "div",
      { className: "menu-content" },
      bookList.map((book) =>
        React.createElement(
          "div",
          {
            key: book,
            className: "menu-item",
            onClick: () => handleBookSelect(book),
          },
          book
        )
      )
    )
  );
}

function SearchMenu({ bibleData, onSearchResult, onClose }) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [searchType, setSearchType] = React.useState("similar"); // 'exact' or 'similar'

  const performSearch = React.useCallback(() => {
    const searchResults = [];
    const lowerQuery = searchQuery.toLowerCase();

    Object.entries(bibleData).forEach(([book, chapters]) => {
      Object.entries(chapters).forEach(([chapter, verses]) => {
        Object.entries(verses).forEach(([verse, text]) => {
          const lowerText = text.toLowerCase();
          let match = false;

          if (searchType === "exact") {
            match = lowerText.includes(lowerQuery);
          } else {
            // similar search
            const words = lowerQuery.split(/\s+/);
            match = words.every((word) => lowerText.includes(word));
          }

          if (match) {
            searchResults.push({ book, chapter, verse, text });
          }
        });
      });
    });

    setResults(searchResults.slice(0, 50)); // Limit to 50 results for performance
  }, [searchQuery, searchType, bibleData]);

  React.useEffect(() => {
    if (searchQuery) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery, searchType, performSearch]);

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
  };

  return React.createElement(
    "div",
    { className: "search-menu" },
    React.createElement(
      "div",
      { className: "search-header" },
      React.createElement("button", { onClick: onClose }, "Close"),
      React.createElement("span", null, "Search")
    ),
    React.createElement(
      "div",
      { className: "search-options" },
      React.createElement("input", {
        type: "text",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: "Enter search text",
        className: "search-input",
      }),
      React.createElement(
        "div",
        { className: "search-type" },
        React.createElement(
          "label",
          null,
          React.createElement("input", {
            type: "radio",
            value: "exact",
            checked: searchType === "exact",
            onChange: () => handleSearchTypeChange("exact"),
          }),
          "Exact"
        ),
        React.createElement(
          "label",
          null,
          React.createElement("input", {
            type: "radio",
            value: "similar",
            checked: searchType === "similar",
            onChange: () => handleSearchTypeChange("similar"),
          }),
          "Similar"
        )
      )
    ),
    React.createElement(
      "div",
      { className: "search-content" },
      results.length > 0
        ? results.map((result, index) =>
            React.createElement(
              "div",
              {
                key: index,
                className: "search-result",
                onClick: () =>
                  onSearchResult(result.book, result.chapter, result.verse),
              },
              `${result.book} ${result.chapter}:${
                result.verse
              } - ${result.text.substring(0, 50)}...`
            )
          )
        : React.createElement(
            "div",
            { className: "no-results" },
            searchQuery ? "No results found" : "Enter a search term"
          )
    )
  );
}

function ChapterSelector({ book, chapters, onSelect, onClose }) {
  return React.createElement(
    "div",
    { className: "menu" },
    React.createElement(
      "div",
      { className: "menu-header" },
      React.createElement("button", { onClick: onClose }, "Close"),
      React.createElement("span", null, `Chapters of ${book}`)
    ),
    React.createElement(
      "div",
      { className: "menu-content" },
      chapters.map((chapter) =>
        React.createElement(
          "div",
          {
            key: chapter,
            className: "menu-item",
            onClick: () => onSelect(chapter),
          },
          `Chapter ${chapter}`
        )
      )
    )
  );
}

ReactDOM.render(React.createElement(BibleApp), document.getElementById("root"));
