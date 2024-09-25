function BibleApp() {
  const [bibleData, setBibleData] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentBook, setCurrentBook] = React.useState("");
  const [currentChapter, setCurrentChapter] = React.useState("1");
  const [currentVerse, setCurrentVerse] = React.useState("1");
  const [selectedVerses, setSelectedVerses] = React.useState([]);
  const [isBookMenuOpen, setIsBookMenuOpen] = React.useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = React.useState(false);
  const [fontSize, setFontSize] = React.useState(16);

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
      if (e.key === "SoftLeft" || e.key === "4") {
        if (isBookMenuOpen) {
          setIsBookMenuOpen(false);
        } else {
          setIsBookMenuOpen(true);
        }
      } else if (e.key === "SoftRight" || e.key === "6") {
        setIsOptionsOpen(true);
      }
    },
    [isBookMenuOpen]
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
    return verses.map(([verse, text]) =>
      React.createElement(
        "p",
        {
          key: verse,
          "data-verse": verse,
          onClick: () => toggleVerseSelection(verse),
          className: selectedVerses.includes(verse) ? "selected" : "",
          style: { fontSize: `${fontSize}px` },
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
    selectedVerses,
    fontSize,
  ]);

  const handleBookSelect = (book, chapter) => {
    setCurrentBook(book);
    setCurrentChapter(chapter || "1");
    setCurrentVerse("1");
    setIsBookMenuOpen(false);
  };

  const changeFontSize = (newSize) => {
    setFontSize(newSize);
    setIsOptionsOpen(false);
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
      React.createElement("span", null, "EternalWords")
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
        { onClick: () => setIsBookMenuOpen(true) },
        "Books"
      ),
      React.createElement(
        "span",
        null,
        `${currentBook} ${currentChapter}:${currentVerse}`
      ),
      React.createElement(
        "span",
        { onClick: () => setIsOptionsOpen(true) },
        "Settings"
      )
    ),
    isBookMenuOpen &&
      React.createElement(BookMenu, {
        bibleData: bibleData,
        onSelect: handleBookSelect,
        onClose: () => setIsBookMenuOpen(false),
      }),
    isOptionsOpen &&
      React.createElement(OptionsMenu, {
        currentFontSize: fontSize,
        onChangeFontSize: changeFontSize,
        onClose: () => setIsOptionsOpen(false),
      })
  );
}

function BookMenu({ bibleData, onSelect, onClose }) {
  const [selectedBook, setSelectedBook] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const books = React.useMemo(() => Object.keys(bibleData), [bibleData]);

  const filteredBooks = React.useMemo(() => {
    return books.filter((book) =>
      book.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const handleBookSelect = (book) => {
    if (selectedBook === book) {
      onSelect(book);
    } else {
      setSelectedBook(book);
    }
  };

  const handleChapterSelect = (chapter) => {
    onSelect(selectedBook, chapter);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const renderBookList = () => {
    return React.createElement(
      "div",
      { className: "book-list" },
      filteredBooks.map((book) =>
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
    );
  };

  const renderChapterList = () => {
    if (!selectedBook) return null;
    const chapters = Object.keys(bibleData[selectedBook]);
    return chapters.map((chapter) =>
      React.createElement(
        "div",
        {
          key: chapter,
          className: "menu-item",
          onClick: () => handleChapterSelect(chapter),
        },
        `Chapter ${chapter}`
      )
    );
  };

  return React.createElement(
    "div",
    { className: "menu" },
    React.createElement(
      "div",
      { className: "menu-content" },
      React.createElement("input", {
        type: "text",
        value: searchQuery,
        onChange: handleSearchChange,
        placeholder: "Search books...",
        className: "search-input",
      }),
      selectedBook
        ? React.createElement(
            React.Fragment,
            null,
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
            renderChapterList()
          )
        : renderBookList()
    ),
    React.createElement(
      "div",
      { className: "menu-header" },
      React.createElement("button", { onClick: onClose }, "Close")
    )
  );
}

function OptionsMenu({ currentFontSize, onChangeFontSize, onClose }) {
  const fontSizes = [12, 14, 16, 18, 20, 22, 24];

  return React.createElement(
    "div",
    { className: "menu" },
    React.createElement(
      "span",
      { className: "settings-menu" },"Navigation instructions"),
    React.createElement(
      "div",
      { className: "menu-content" },
      React.createElement(
        "ul",
        { className: "instruction-menu" }, "Use number keys to navigate"),
      React.createElement(
        "li",
        { className: "instruction-item" },
        "4 - Left shoulder button"
      ),
      React.createElement(
        "li",
        { className: "instruction-item" },
        "6 - Right shoulder button"
      ),
      React.createElement(
        "li",
        { className: "instruction-item" },
        "7 - Zoom out"
      ),
      React.createElement(
        "li",
        { className: "instruction-item" },
        "4 - Zoom in"
      ),
      React.createElement(
        "hr"
      ),
      React.createElement("div", { className: "menu-item" }, "Font Size:"),
      fontSizes.map((size) =>
        React.createElement(
          "div",
          {
            key: size,
            className: `menu-item ${
              size === currentFontSize ? "selected" : ""
            }`,
            onClick: () => onChangeFontSize(size),
          },
          `${size}px`
        )
      )
    ),
    React.createElement(
      "div",
      { className: "menu-header" },
      React.createElement("button", { onClick: onClose }, "Close")
    )
  );
}

ReactDOM.render(React.createElement(BibleApp), document.getElementById("root"));
