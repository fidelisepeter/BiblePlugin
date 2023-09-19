// bible-plugin.js
class BiblePlugin {
  constructor(apiKey, options = { header, fullScreenButton, pagination }) {
    this.pluginName = "Bible Scripture Popup";
    this.pluginShortName = "BSPop";
    this.apiKey = apiKey;
    this.apiUrl = "https://bspop.alresia.com/api/get-passage";
    this.version = options.version || "kjv";
    this.bible;
    this.contentOption = options.content;
    this.showRedText = options.content?.showRedText || false;
    this.showItalizedText = options.content?.showItalizedText || false;
    this.justifyText = options.content?.justifyText || false;
    this.showVerseInHeader = options.header?.showVerse || false;
    this.showVersionInHeader = options.header?.showVersion || false;
    this.headerClass = options.header?.className || "";

    this.fullScreenButton = options.fullScreenButton || true;
    this.showPreLoader = options.showPreLoader || true;
    this.showSpinner = options.showSpinner || false;
    // this.pagination = options.pagination || true;
    this.pagination = options.pagination?.show || false;
    this.displayOn = options.displayOn || "click";
    this.popupStyle = options.popupStyle || {};
    this.init();
    this.tempClick = false;
    this.popupVisible = false;
    this.currentSectionIndex = 0;

    this.initAutoFill(); // Initialize automatic scripture filling
  }

  createName(str) {
    return (this.pluginShortName = `${this.pluginName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${str}`);
  }

  init() {
    // Find all elements with the 'bible' tag
    const bibleElements = document.querySelectorAll("bible");

    bibleElements.forEach((element) => {
      if (this.displayOn === "click") {
        this.bible = element;
        element.addEventListener("click", () => this.togglePopup(element));
      } else if (this.displayOn === "hover") {
        element.addEventListener("mouseenter", () => {
          this.showPopup(element);

          this.popup.addEventListener("mouseenter", () => {
            this.popupVisible = true;
            this.popup
              .querySelector(".content-body")
              .addEventListener("click", () => {
                this.popupVisible = true;
                this.tempClick = true;
              });
          });
        });

        element.addEventListener("mouseleave", () => {
          setTimeout(() => {
            if (this.popupVisible == false) {
              if (!this.tempClick) {
                this.hidePopup();
              }
            } else {
              this.popup.addEventListener("mouseleave", () => {
                this.popupVisible = false;
                if (!this.tempClick) {
                  this.hidePopup();
                }
              });
            }
          }, 100);
        });
      }
    });
  }

  // Initialize automatic scripture filling
  initAutoFill() {
    // Find all <bible> elements with 'get' or 'book, chapter, verse' attributes
    const bibleGetElements = document.querySelectorAll(
      "bible[get], bible[book][chapter]"
    );
    bibleGetElements.forEach((element) => {
      this.fillScripture(element);
    });
  }

  togglePopup(element) {
    if (this.popupVisible) {
      this.hidePopup();
    } else {
      this.showPopup(element);
    }
  }
  /**
   * Get the Bible scription from the element and parse the bible passage.
   *
   * @param element
   * @returns array[]
   */
  getScripture(element) {
    const getAttribute = element.getAttribute("get");
    const bookAttribute = element.getAttribute("book");
    const chapterAttribute = element.getAttribute("chapter");
    const verseAttribute = element.getAttribute("verse");
    const textContent = element.textContent.trim();

    if (this.parseBiblePassage(getAttribute)) {
      // Handle 'get' attribute
      return this.parseBiblePassage(getAttribute);
    } else if (
      this.parseBiblePassage(
        `${bookAttribute} ${chapterAttribute}:${verseAttribute}`
      )
    ) {
      // Handle 'book', 'chapter', and 'verse' attributes
      return this.parseBiblePassage(
        `${bookAttribute} ${chapterAttribute}:${verseAttribute}`
      );
    } else if (this.parseBiblePassage(textContent)) {
      // Handle text content in the format "Genesis 1:1"
      return this.parseBiblePassage(textContent);
    }

    return false;
  }

  showPopup(element) {
    if (this.showPreLoader) {
      this.preLoader(element, true);
    }

    const $ = {
      bible: this.getScripture(element),
    };
    console.log($);

    const versionAttribute = element.getAttribute("version");

    // Determine which attribute(s) are present and make the API request accordingly
    var scripture = $.bible.scripture;

    // Define the request parameters
    const requestParams = {
      method: "POST",
      url: this.apiUrl,
      contentType: "application/json", // Set the content type
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      data: JSON.stringify({
        version: this.version,
        book: $.bible.book,
        chapter: $.bible.chapter,
        verses: $.bible.verses,
      }), // Convert form data to JSON
      dataType: "json", // Expect JSON response
      success: (response) => {
        console.log(response);
        // Handle the successful response here

        // Display the result in a popup

        this.createPopup(response.data, `${scripture}`, response.details);
        this.positionPopup(element);

        this.preLoader(element, false);
      },
      error: (error) => {
        // Handle any errors here
        console.error("Error:", error);
      },
    };

    // Make the request
    this.request(requestParams);
  }

  preLoader(element, show = true) {
    const preloader = document.createElement("span");
    const styleElement = document.createElement("style");
    const spinner = `@keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
    @keyframes dim {
      0% {
        opacity: 0.2;
    }
    30% {
        opacity: 0.5; /* Undim halfway through the animation */
    }
    75% {
        opacity: 0.7;
    }
    100% {
      opacity: 1;
    }
    
    }`;
    styleElement.innerHTML = spinner;
    styleElement.setAttribute(
      `data-${this.createName("preloader-keyframe")}`,
      ""
    );
    const isStyleElement = document.head.querySelector(
      `style[data-${this.createName("preloader-keyframe")}]`
    );
    if (isStyleElement) {
      isStyleElement.innerHTML = spinner;
    } else {
      document.head.appendChild(styleElement);
    }

    const preloaderInner = document.createElement("span");
    preloaderInner.className = this.createName("preloader-inner");
    // preloaderInner.innerText = " ";
    preloaderInner.style.width = "100%";
    preloaderInner.style.height = "100%";
    preloaderInner.style.position = "absolute";
    preloaderInner.style.backgroundColor = "#fff";
    preloaderInner.style.clipPath =
      "polygon(0% 50%, 100% 35%, 100% 100%, 0% 100%)";

    preloader.className = this.createName("preloader");
    preloader.style.display = "inline-block";
    preloader.style.width = "10px";
    preloader.style.height = "10px";
    preloader.style.backgroundColor = "#cdc8c8";
    preloader.style.position = "relative";
    preloader.style.borderRadius = "50%";
    preloader.style.marginLeft = "5px";
    preloader.style.overflow = "hidden";
    preloader.style.animation =
      "2s cubic-bezier(0.18, 0.89, 0.32, 1.28) 0s infinite normal none running spin";
    preloader.appendChild(preloaderInner);

    // element.appendChild(preloader);
    var el = element.querySelector(`.${this.createName("preloader")}`);
    if (show) {
      if (el) {
        el.remove();
      }
      element.style.animation = "dim 1s linear infinite";
      if (this.showSpinner) {
        element.appendChild(preloader);
      }
    } else {
      setInterval(() => {
        if (el) {
          el.remove();
        }
        element.style.animation = "";
        isStyleElement.remove();
      }, 1000);
    }
  }

  parseBiblePassage(text) {
    // Define a regular expression pattern for matching Bible passages
    const pattern =
      /^([1-3]?[1-9 A-Za-z]+) (\d+)(?::(\d+)(?:-(\d+))?(?:,(\d+)(?:-(\d+))?)*)?$/;

    // Use the exec() method to capture book, chapter, and verse information
    const match = pattern.exec(text);

    const ucwords = (str) => {
      return (str + "").replace(/^([a-z])|\s+([a-z])/g, function ($1) {
        return $1.toUpperCase();
      });
    };

    if (match) {
      const [, book, chapter, startVerse, endVerse] = match;
      const short_verses = match[0].split(":")[1];
      const parsedPassage = {
        scripture: ucwords(match[0].toLowerCase()),
        book: ucwords(book.toLowerCase()),
        chapter: parseInt(chapter),
        short_verses: short_verses,
        verses: [],
      };

      if (short_verses) {
        const ranges = short_verses.split(",");
        for (const range of ranges) {
          const parts = range.split("-");
          if (parts.length === 1) {
            parsedPassage.verses.push(parseInt(parts[0]));
          } else if (parts.length === 2) {
            const start = parseInt(parts[0]);
            const end = parseInt(parts[1]);
            for (let i = start; i <= end; i++) {
              parsedPassage.verses.push(i);
            }
          }
        }
      }
      return parsedPassage;
    } else {
      return null; // Return null for invalid passages
    }
  }

  createPopup(passage, title, details = []) {
    const showItalizedText = this.showItalizedText;
    const showRedText = this.showRedText;
    const justifyText = this.justifyText;

    // Create a popup element and style it
    this.popup = document.createElement("div");
    this.popup.className = this.createName("popup");
    this.popup.style.position = "absolute";
    this.popup.style.backgroundColor = "#fff";
    this.popup.style.backgroundClip = "padding-box";
    this.popup.style.borderRadius = "8px";
    this.popup.style.boxShadow =
      "0 6px 16px 0 rgba(0,0,0,.08),0 3px 6px -4px rgba(0,0,0,.12),0 9px 28px 8px rgba(0,0,0,.05)";
    this.popup.style.padding = "12px";
    this.popup.style.maxWidth = "250px"; // Set a maximum width, adjust as needed
    this.popup.style.maxHeight = "100%";

    //Create the arrow element and Create the :before pseudo-element for the arrow
    const arrow = document.createElement("div");
    arrow.className = this.createName("popup-arrow");
    arrow.style.borderBottom = "7px solid #fff";
    arrow.style.borderRight = "7px solid transparent";
    arrow.style.borderLeft = "7px solid transparent";
    arrow.style.top = "-7px";
    arrow.style.content = "";
    arrow.style.display = "block";
    arrow.style.left = "50%";
    arrow.style.marginLeft = "-7px";
    arrow.style.position = "absolute";

    // Append the arrow to the popup
    this.popup.appendChild(arrow);

    // Create the title element
    const titleElement = document.createElement("div");
    titleElement.className = this.createName("title");
    titleElement.style.borderBottom = "1px solid #f7f1f1";
    titleElement.style.padding = "0px 0px 5px 0px";
    titleElement.style.marginBottom = "5px";
    titleElement.innerHTML = `<span>${
      this.showVerseInHeader ? title : title.split(":")[0]
    }</span>`;

    if (this.showVersionInHeader) {
      // Create the title element
      const versionElement = document.createElement("span");
      versionElement.className = `.${this.createName("version")}`;
      versionElement.style.color = "#b9b9b9";
      versionElement.style.fontSize = "13px";
      versionElement.style.marginLeft = "6px";
      versionElement.style.fontFamily = "fantasy";
      versionElement.style.position = "relative";
      versionElement.innerHTML = "(" + details.shortname + ")";
      titleElement.appendChild(versionElement);

      versionElement.addEventListener("click", (event) => {
        const versionChanger = document.createElement("div");
        versionChanger.className = `.${this.createName("change-version")}`;
        versionChanger.style.fontSize = "13px";
        versionChanger.style.fontFamily = "none";
        versionChanger.style.width = "fit-content";
        versionChanger.style.maxHeight = "inherit";
        versionChanger.style.position = "absolute";
        versionChanger.style.top = "18px";
        versionChanger.style.left = "0px";
        versionChanger.style.position = "absolute";
        versionChanger.style.backgroundColor = "#fff";
        versionChanger.style.backgroundClip = "padding-box";
        versionChanger.style.borderRadius = "8px";
        versionChanger.style.boxShadow =
          "0 6px 16px 0 rgba(0,0,0,.08),0 3px 6px -4px rgba(0,0,0,.12),0 9px 28px 8px rgba(0,0,0,.05)";
        versionChanger.style.padding = "0px";

        versionChanger.addEventListener("click", (event) => {
          event.stopPropagation();
        });

        const ul = document.createElement("ul");

        versionChanger.appendChild(this.listVersions());
        versionElement.appendChild(versionChanger);
      });
    }
    // Create the close button element
    const closeButton = document.createElement("span");
    closeButton.className = this.createName("close-button");
    closeButton.innerHTML = "&times";
    closeButton.style.cursor = "pointer";
    closeButton.style.color = "#b9b9b9";
    closeButton.style.fontSize = "23px";
    closeButton.style.float = "right";
    closeButton.style.marginTop = "-5px"; // Adjust margin as needed

    // Append the close button and title text to the title element
    titleElement.appendChild(closeButton);

    // Create the content element
    const contentElement = document.createElement("div");
    contentElement.className = this.createName("content");
    contentElement.style.overflow = "auto";
    contentElement.style.maxHeight = "100%";
    const contentElementInner = document.createElement("div");
    contentElementInner.className = this.createName("content-body");

    if (justifyText) {
      contentElementInner.style.textAlign = "justify";
    }
    // Append the contentElementInner to the popup
    contentElement.appendChild(contentElementInner);

    function parseSections(content) {
      const sections = [];

      for (const key in content) {
        var verse = key;
        var text = content[key];
        if (showItalizedText) {
          text = text.replace(/\[(.*?)\]/g, "<i>$1</i>");
        } else {
          text = text.replace(/\[(.*?)\]/g, "$1");
        }

        if (showRedText) {
          text = text.replace(
            /\u2039(.*?)\u203a/g,
            '<span style="color:red">$1</span>'
          ); //RED TEXT
        } else {
          text = text.replace(/\u2039(.*?)\u203a/g, "$1");
        }

        sections.push({ sectionNumber: verse, sectionContent: text });
      }

      return sections;
    }

    let sections = parseSections(passage); // Parse the sections
    let currentSectionIndex = this.currentSectionIndex; // Initialize the current section index

    let isShowingAll = true; // Track if "Show All" is clicked
    // Track if "Show All" is clicked

    // Function to update the displayed content
    if (this.pagination) {
      isShowingAll = !isShowingAll;
    }

    function updateContent() {
      let contentHTML = "";

      if (isShowingAll) {
        // Display all sections with superscripted section numbers
        sections.forEach((section, index) => {
          const sectionNumber = section.sectionNumber;
          contentHTML += `<sup style="
          color: inherit;
          font-weight: bold;
          opacity: 0.3;
      ">${sectionNumber}</sup> ${section.sectionContent}<br>`;
        });
      } else {
        // Display the current section with superscripted section number
        const section = sections[currentSectionIndex];
        const sectionNumber = section.sectionNumber;
        contentHTML = `<sup style="
        color: inherit;
        font-weight: bold;
        opacity: 0.3;
    ">${sectionNumber}</sup> ${section.sectionContent.trim()}`;
      }

      contentElementInner.innerHTML = contentHTML;

      // Check if content exceeds the maximum height and enable scrolling
      if (contentElementInner.scrollHeight > contentElement.offsetHeight) {
        contentElementInner.style.overflowY = "auto";
        contentElementInner.style.maxHeight = "250px"; // Set your desired maximum height here
      } else {
        contentElementInner.style.overflow = "auto";
        contentElementInner.style.maxHeight = "250px";
      }
    }

    // Append the arrow, title, and content to the popup
    this.popup.appendChild(titleElement);
    this.popup.appendChild(contentElement);
    // if (this.pagination) {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = this.createName("button-container");
    buttonContainer.style.float = "right";

    // Create the "Previous" button
    const previousButton = document.createElement("button");
    previousButton.innerHTML = "&lt;&lt;"; // Use &lt;&lt; for "<<"
    previousButton.className = this.createName("popup-button");
    previousButton.style.backgroundColor = "transparent";
    previousButton.style.padding = " 5px";
    previousButton.style.border = "1px solid #f7f1f1";
    previousButton.title = "Go to Previous"; // Add a title attribute

    // Create the "Next" button border: 1px solid rgb(247, 241, 241);
    const nextButton = document.createElement("button");
    nextButton.innerHTML = "&gt;&gt;"; // Use &gt;&gt; for ">>"
    nextButton.className = this.createName("popup-button");
    nextButton.style.backgroundColor = "transparent";
    nextButton.style.padding = " 5px";
    nextButton.style.border = "1px solid #f7f1f1";
    nextButton.title = "Go to Next"; // Add a title attribute

    // Create the "View All" button
    const viewAllButton = document.createElement("button");
    viewAllButton.innerHTML = "&#9660;"; // Use &#9660; for a down arrow
    viewAllButton.className = this.createName("popup-button");
    viewAllButton.style.backgroundColor = "transparent";
    viewAllButton.style.padding = " 5px";
    viewAllButton.style.border = "1px solid #f7f1f1";
    viewAllButton.title = "View All Options"; // Add a title attribute
    // viewAllButton.disabled = true;

    // Append the buttons to the container
    buttonContainer.appendChild(previousButton);
    buttonContainer.appendChild(nextButton);
    buttonContainer.appendChild(viewAllButton);

    // Append the buttons to the container
    const footer = document.createElement("div");

    // Append the container to the popup
    if (this.pagination) {
      footer.appendChild(buttonContainer);
    }

    footer.style.marginTop = "15px";
    // Append the container to the popup
    this.popup.appendChild(footer);

    // Add event listeners for mouseenter
    buttonContainer.querySelectorAll("button").forEach((button) => {
      // Apply styles to all buttons when mouse enters the container
      button.addEventListener("mouseenter", (e) => {
        // Add styles for hover (mouse enter) effect
        if (button.disabled != true) {
          button.style.backgroundColor = "#f0f0f0"; // Change background color
          button.style.color = "#333"; // Change text color
        }
      });
    });

    // Add event listeners for mouseleave
    buttonContainer.querySelectorAll("button").forEach((button) => {
      // Apply styles to all buttons when mouse leave the container
      button.addEventListener("mouseleave", (e) => {
        // Add styles for hover (mouse leave) effect
        button.style.backgroundColor = "transparent"; // Change background color
        button.style.color = ""; // Change text color
      });
    });

    previousButton.addEventListener("click", () => {
      if (currentSectionIndex > 0) {
        currentSectionIndex--;
        this.currentSectionIndex = currentSectionIndex;
        this.updateContent1(contentElementInner, sections, isShowingAll);
      }
    });
    nextButton.addEventListener("click", () => {
      // Handle the "Next" button click event here
      if (currentSectionIndex < sections.length - 1) {
        currentSectionIndex++;
        this.currentSectionIndex = currentSectionIndex;
        this.updateContent1(contentElementInner, sections, isShowingAll);
      }
    });
    viewAllButton.addEventListener("click", () => {
      // Handle the "View All" button click event here
      isShowingAll = !isShowingAll;
      this.updateContent1(contentElementInner, sections, isShowingAll);
    });

    this.updateContent1(contentElementInner, sections, isShowingAll);

    // Append the popup to the body
    document.body.appendChild(this.popup);

    setTimeout(() => {
      // Add a click event listener to the document
      document.addEventListener("click", clickOutsideHandler);
    }, 100);

    // Define the click event handler
    const clickOutsideHandler = (event) => {
      const isClickInsidePopup = this.popup.contains(event.target);
      const isClickButton = closeButton.contains(event.target);

      if (!isClickInsidePopup) {
        this.tempClick = false;
        this.hidePopup();
        // Remove the event listener to avoid multiple clicks
        document.removeEventListener("click", clickOutsideHandler);
      }

      if (isClickButton) {
        this.tempClick = false;
        this.hidePopup();
        // Remove the event listener to avoid multiple clicks
        document.removeEventListener("click", clickOutsideHandler);
      }
    };
    // Add a click event listener to close the popup when the close button is clicked
    closeButton.addEventListener("click", clickOutsideHandler);

    return this.popup;
  }

  positionPopup(element) {
    // Get the dimensions of the viewport
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    // Get the dimensions of the element
    const elementRect = element.getBoundingClientRect();
    const popupRect = element.getBoundingClientRect();
    let isPopDown = false;

    // Set initial popup position to be below the element
    let popupLeft = elementRect.left;
    let popupTop = elementRect.bottom + 8;
    let popupMaxHeigth = "";

    //get the arrow element
    let arrow = this.popup.querySelector(`.${this.createName("popup-arrow")}`);

    // Check if there's enough space below the element, otherwise, position above
    if (popupTop + this.popup.offsetHeight > viewportHeight) {
      popupTop = elementRect.top - this.popup.offsetHeight - 8;

      popupMaxHeigth = viewportHeight - popupTop;

      isPopDown = true;

      arrow.style.borderTop = "7px solid #fff";
      arrow.style.bottom = "-7px";
      arrow.style.borderBottom = "";
      arrow.style.top = "";
    } else {
      this.popup.style.boxShadow =
        "0 -6px 16px 0 rgba(0,0,0,.08),0 3px 6px -4px rgba(0,0,0,.12),0 9px 28px 8px rgba(0,0,0,.05)";

      arrow.style.borderBottom = "7px solid #fff";
      arrow.style.top = "-7px";
      arrow.style.borderTop = "";
      arrow.style.bottom = "";
    }

    // Check if there's enough space to the right of the element, otherwise, position to the left
    if (popupLeft + this.popup.offsetWidth > viewportWidth) {
      popupLeft = elementRect.right - this.popup.offsetWidth;
    }
    // Calculate the horizontal center of the element
    const elementCenterX = elementRect.left + elementRect.width / 2;

    // Calculate the left position for the arrow to center it
    const arrowLeft = elementCenterX - popupLeft - 7; // 7 is half the width of the arrow

    // Set the calculated position for the arrow
    arrow.style.left = `${arrowLeft}px`;

    // Set the calculated position for the popup
    this.popup.style.left = `${popupLeft}px`;
    this.popup.style.top = `${popupTop}px`;

    if (isPopDown) {
      var maxHeight = viewportHeight - popupRect.top;
      maxHeight = viewportHeight - maxHeight;

      this.popup.style.top = "";
      this.popup.style.bottom = `${viewportHeight - elementRect.bottom + 25}px`;
      this.popup.querySelector(
        `.${this.createName("content-body")}`
      ).style.maxHeight = `${maxHeight - 120}px`;
    } else {
      var maxHeight = viewportHeight - popupTop;
      this.popup.querySelector(
        `.${this.createName("content-body")}`
      ).style.maxHeight = `${maxHeight - 120}px`;
    }
  }

  updateContent1(element, verses, isShowingAll = true) {
    let contentHTML = "";

    if (isShowingAll) {
      // Display all sections with superscripted section numbers
      verses.forEach((section, index) => {
        const sectionNumber = section.sectionNumber;
        contentHTML += `<sup style="
        color: inherit;
        font-weight: bold;
        opacity: 0.3;
    ">${sectionNumber}</sup> ${section.sectionContent}<br>`;
      });
    } else {
      // Display the current section with superscripted section number
      const section = verses[this.currentSectionIndex];
      const sectionNumber = section.sectionNumber;
      contentHTML = `<sup style="
      color: inherit;
      font-weight: bold;
      opacity: 0.3;
  ">${sectionNumber}</sup> ${section.sectionContent.trim()}`;
    }

    element.innerHTML = contentHTML;

    // Check if content exceeds the maximum height and enable scrolling
    if (element.scrollHeight > element.parentNode.offsetHeight) {
      element.style.overflowY = "auto";
      element.style.maxHeight = "250px"; // Set your desired maximum height here
    } else {
      element.style.overflow = "auto";
      element.style.maxHeight = "250px";
    }
  }

  listVersions() {
    const ul = document.createElement("ul");
    ul.className = `.${this.createName("version-list")}`;
    ul.style.listStyleType = "none";
    ul.style.padding = "0px";
    ul.style.margin = "5px 0px";

    const bibleVersions = [
      {
        name: "Authorized King James Version",
        shortname: "KJV",
        module: "kjv",
        italics: 1,
        strongs: 0,
        red_letter: 0,
        lang: "English",
        lang_short: "en",
      },

      {
        name: "American Standard Version",
        shortname: "ASV",
        module: "asv",
        italics: 1,
        strongs: 0,
        red_letter: 0,
        lang: "English",
        lang_short: "en",
      },
      {
        name: "New Living Transalaton",
        shortname: "NLV",
        module: "nlv",
        italics: 1,
        strongs: 0,
        red_letter: 0,
        lang: "English",
        lang_short: "en",
      },
    ];

    for (let index = 0; index < bibleVersions.length; index++) {
      let version = bibleVersions[index].shortname.toUpperCase();
      let currentVersion = this.version.toUpperCase();

      var li = document.createElement("li");
      li.className = `.${this.createName("version-list")} version-${version}`;
      li.innerText = version;
      li.setAttribute(`version`, `${version}`);
      li.style.fontSize = "13px";
      li.style.padding = "5px 12px";
      li.style.backgroundColor = version == currentVersion ? "#f5f5f5" : "";
      li.style.color = version == currentVersion ? "#1e1e1e" : "#b9b9b9";

      ul.appendChild(li);
      if (version != currentVersion) {
        var list = ul.querySelector(`.version-${version}`);
        list.addEventListener("mouseenter", (e) => {
          // Add styles for hover (mouse enter) effect
          ul.querySelector(`.version-${version}`).style.backgroundColor =
            "#f5f5f5"; // Change background color
          ul.querySelector(`.version-${version}`).style.color = "#1e1e1e"; // Change text color
        });

        list.addEventListener("mouseleave", (e) => {
          // Remove styles for hover (mouse leave) effect
          ul.querySelector(`.version-${version}`).style.backgroundColor =
            "transparent"; // Change background color
          ul.querySelector(`.version-${version}`).style.color = ""; // Change text color
        });

        list.addEventListener("click", (e) => {
          this.switchVersion(version);
          ul.parentNode.remove();
        });
      }
    }

    return ul;
  }

  switchVersion(version) {
    alert("switching version to " + version + "...");
    this.version = version;
  }

  hidePopup() {
    if (this.popup) {
      this.popup.remove();
      this.popupVisible = false;
      this.tempClick = false;
    }
  }

  // Function to automatically fill scripture for <bible> elements
  fillScripture(element) {
    const data = this.getScripture(element);

    // Determine which attribute(s) are present and make the API request accordingly
    element.innerHTML = data.scripture;
  }

  request(options) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open(options.method || "GET", options.url);

      // Set the Content-Type header if contentType is provided
      if (options.contentType) {
        xhr.setRequestHeader("Content-Type", options.contentType);
      }

      if (options.headers) {
        for (const header in options.headers) {
          xhr.setRequestHeader(header, options.headers[header]);
        }
      }

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            let response = xhr.responseText;
            if (options.dataType === "json") {
              try {
                response = JSON.parse(xhr.responseText);
              } catch (error) {
                if (typeof options.error === "function") {
                  options.error("Error parsing JSON response");
                }
                reject("Error parsing JSON response");
                return;
              }
            }

            if (typeof options.success === "function") {
              options.success(response);
            }
            resolve(response);
          } else {
            if (typeof options.error === "function") {
              options.error(xhr.statusText);
            }
            reject(xhr.statusText);
          }
        }
      };

      xhr.onerror = function () {
        if (typeof options.error === "function") {
          options.error(xhr.statusText);
        }
        reject(xhr.statusText);
      };

      xhr.send(options.data);
    });
  }
}
