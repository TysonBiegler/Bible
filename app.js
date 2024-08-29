function BibleApp() {
  const [bibleData, setBibleData] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentBook, setCurrentBook] = React.useState('');
  const [currentChapter, setCurrentChapter] = React.useState('1');
  const [currentVerse, setCurrentVerse] = React.useState('1');
  const [selectedVerses, setSelectedVerses] = React.useState([]);
  const [isBookMenuOpen, setIsBookMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
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
      console.error('Failed to load Bible data');
    };

    window.addEventListener('bibleDataLoaded', handleDataLoaded);
    window.addEventListener('bibleDataFailed', handleDataFailed);

    return () => {
      window.removeEventListener('bibleDataLoaded', handleDataLoaded);
      window.removeEventListener('bibleDataFailed', handleDataFailed);
    };
  }, []);

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'SoftLeft' || e.key === '4') {
      setIsBookMenuOpen(true);
    } else if (e.key === 'SoftRight' || e.key === '6') {
      setIsSearchOpen(true);
    }
  }, []);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const toggleVerseSelection = (verse) => {
    setSelectedVerses(prevSelected => {
      if (prevSelected.includes(verse)) {
        return prevSelected.filter(v => v !== verse);
      } else {
        return [...prevSelected, verse].sort((a, b) => parseInt(a) - parseInt(b));
      }
    });
  };

  const chapterText = React.useMemo(() => {
    if (isLoading || !bibleData || !currentBook || !currentChapter) {
      return [];
    }
    if (!bibleData[currentBook] || !bibleData[currentBook][currentChapter]) {
      console.error('Invalid book or chapter:', currentBook, currentChapter);
      return [];
    }
    const verses = Object.entries(bibleData[currentBook][currentChapter]);
    return verses.map(([verse, text]) => (
      React.createElement('p', {
        key: verse,
        'data-verse': verse,
        onClick: () => toggleVerseSelection(verse),
        className: selectedVerses.includes(verse) ? 'selected' : '',
        style: { fontSize: `${fontSize}px` }
      },
        React.createElement('strong', null, verse + '. '),
        text
      )
    ));
  }, [isLoading, bibleData, currentBook, currentChapter, selectedVerses, fontSize]);

  const handleBookSelect = (book, chapter) => {
    setCurrentBook(book);
    setCurrentChapter(chapter || '1');
    setCurrentVerse('1');
    setIsBookMenuOpen(false);
  };

  const handleSearchResult = (book, chapter, verse) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
    setCurrentVerse(verse);
    setIsSearchOpen(false);
  };

  const changeFontSize = (newSize) => {
    setFontSize(newSize);
    setIsOptionsOpen(false);
  };

  if (isLoading) {
    return React.createElement('div', null, 'Loading Bible data...');
  }

  if (!bibleData || Object.keys(bibleData).length === 0) {
    return React.createElement('div', null, 'No Bible data available. Please check your data source.');
  }

  return React.createElement('div', { className: 'app-container' },
    React.createElement('div', { className: 'header' },
      React.createElement('span', null, 'EternalWords')
    ),
    React.createElement('div', { className: 'content' },
      chapterText.length > 0 ? chapterText : React.createElement('p', null, 'No verses found for this chapter.')
    ),
    React.createElement('div', { className: 'footer' },
      React.createElement('span', { onClick: () => setIsBookMenuOpen(true) }, 'Books'),
      React.createElement('span', null, `${currentBook} ${currentChapter}:${currentVerse}`),
      React.createElement('span', { onClick: () => setIsSearchOpen(true) }, 'Search')
    ),
    isBookMenuOpen && React.createElement(BookMenu, {
      bibleData: bibleData,
      onSelect: handleBookSelect,
      onClose: () => setIsBookMenuOpen(false)
    }),
    isSearchOpen && React.createElement(SearchMenu, {
      bibleData: bibleData,
      onSearchResult: handleSearchResult,
      onOptions: () => setIsOptionsOpen(true),
      onClose: () => setIsSearchOpen(false)
    }),
    isOptionsOpen && React.createElement(OptionsMenu, {
      currentFontSize: fontSize,
      onChangeFontSize: changeFontSize,
      onClose: () => setIsOptionsOpen(false)
    })
  );
}




// ------------------------------------------------------------------------
function BookMenu({ bibleData, onSelect, onClose }) {
  const [selectedBook, setSelectedBook] = React.useState(null);
  const books = Object.keys(bibleData);

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

  if (selectedBook) {
    const chapters = Object.keys(bibleData[selectedBook]);
    return React.createElement('div', { className: 'menu' },
      React.createElement('div', { className: 'menu-header' },
        React.createElement('button', { onClick: () => setSelectedBook(null) }, 'Back'),
        React.createElement('span', null, `Chapters of ${selectedBook}`)
      ),
      React.createElement('div', { className: 'menu-content' },
        chapters.map(chapter =>
          React.createElement('div', {
            key: chapter,
            className: 'menu-item',
            onClick: () => handleChapterSelect(chapter)
          }, `Chapter ${chapter}`)
        )
      )
    );
  }

  return React.createElement('div', { className: 'menu' },
    React.createElement('div', { className: 'menu-header' },
      React.createElement('button', { onClick: onClose }, 'Close'),
      React.createElement('span', null, 'Books of the Bible')
    ),
    React.createElement('div', { className: 'menu-content' },
      books.map(book =>
        React.createElement('div', {
          key: book,
          className: 'menu-item',
          onClick: () => handleBookSelect(book)
        }, book)
      )
    )
  );
}

function SearchMenu({ bibleData, onSearchResult, onOptions, onClose }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [results, setResults] = React.useState([]);

  const performSearch = () => {
    const searchResults = [];
    Object.entries(bibleData).forEach(([book, chapters]) => {
      Object.entries(chapters).forEach(([chapter, verses]) => {
        Object.entries(verses).forEach(([verse, text]) => {
          if (text.toLowerCase().includes(searchQuery.toLowerCase())) {
            searchResults.push({ book, chapter, verse, text });
          }
        });
      });
    });
    setResults(searchResults.slice(0, 50)); // Limit to 50 results for performance
  };

  return React.createElement('div', { className: 'menu' },
    React.createElement('div', { className: 'menu-header' },
      React.createElement('button', { onClick: onClose }, 'Close'),
      React.createElement('span', null, 'Search'),
      React.createElement('button', { onClick: onOptions }, 'Options')
    ),
    React.createElement('div', { className: 'menu-content' },
      React.createElement('input', {
        type: 'text',
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: 'Enter search text',
        className: 'search-input'
      }),
      React.createElement('button', { onClick: performSearch }, 'Search'),
      results.map((result, index) =>
        React.createElement('div', {
          key: index,
          className: 'menu-item',
          onClick: () => onSearchResult(result.book, result.chapter, result.verse)
        }, `${result.book} ${result.chapter}:${result.verse} - ${result.text.substring(0, 50)}...`)
      )
    )
  );
}

function OptionsMenu({ currentFontSize, onChangeFontSize, onClose }) {
  const fontSizes = [12, 14, 16, 18, 20, 22, 24];

  return React.createElement('div', { className: 'menu' },
    React.createElement('div', { className: 'menu-header' },
      React.createElement('button', { onClick: onClose }, 'Close'),
      React.createElement('span', null, 'Options')
    ),
    React.createElement('div', { className: 'menu-content' },
      React.createElement('div', { className: 'menu-item' }, 'Font Size:'),
      fontSizes.map(size =>
        React.createElement('div', {
          key: size,
          className: `menu-item ${size === currentFontSize ? 'selected' : ''}`,
          onClick: () => onChangeFontSize(size)
        }, `${size}px`)
      )
    )
  );
}

function ShareMenu({ bibleData, currentBook, currentChapter, selectedVerses, onClose }) {
  const shareText = selectedVerses.map(verse =>
    `${verse}. ${bibleData[currentBook][currentChapter][verse]}`
  ).join('\n');

  const handleShare = (method) => {
    const fullShareText = `${shareText}\n\n${currentBook} ${currentChapter}:${selectedVerses.join('-')}\n\nShared from KaiOS Bible App`;

    if (method === 'sms') {
      window.open(`sms:?body=${encodeURIComponent(fullShareText)}`);
    } else if (method === 'email') {
      window.open(`mailto:?body=${encodeURIComponent(fullShareText)}&subject=Bible Verses`);
    }

    onClose();
  };

  return React.createElement('div', { className: 'menu' },
    React.createElement('div', { className: 'menu-header' },
      React.createElement('button', { onClick: onClose }, 'Close'),
      React.createElement('span', null, 'Share')
    ),
    React.createElement('div', { className: 'menu-content' },
      React.createElement('div', { className: 'menu-item', onClick: () => handleShare('sms') }, 'Share via SMS'),
      React.createElement('div', { className: 'menu-item', onClick: () => handleShare('email') }, 'Share via Email')
    )
  );
}

ReactDOM.render(React.createElement(BibleApp), document.getElementById('root'));