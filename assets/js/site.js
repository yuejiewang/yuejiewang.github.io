(() => {
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let theme = "system";
  try {
    const stored = localStorage.getItem("theme");
    if (["system", "light", "dark"].includes(stored)) theme = stored;
  } catch {}

  function applyTheme() {
    const computed = theme === "system" ? (systemTheme.matches ? "dark" : "light") : theme;
    root.dataset.themeSetting = theme;
    root.dataset.theme = computed;
    document.querySelectorAll("table").forEach((table) => table.classList.toggle("table-dark", computed === "dark"));
    const toggle = document.getElementById("light-toggle");
    if (toggle) toggle.setAttribute("aria-label", `Change theme (current: ${theme})`);
  }

  function setTheme(value) {
    theme = value;
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    applyTheme();
  }

  applyTheme();
  systemTheme.addEventListener("change", applyTheme);

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    const navbar = document.getElementById("navbar");
    const navigation = document.getElementById("navbarNav");
    const navToggle = document.querySelector('.navbar-toggler[aria-controls="navbarNav"]');
    const progress = document.getElementById("progress");
    const themeToggle = document.getElementById("light-toggle");
    const searchToggle = document.getElementById("search-toggle");

    function setNavigation(open) {
      if (!navigation || !navToggle) return;
      navigation.classList.toggle("show", open);
      navToggle.classList.toggle("collapsed", !open);
      navToggle.setAttribute("aria-expanded", String(open));
      updateScroll();
    }

    navToggle?.addEventListener("click", () => setNavigation(!navigation.classList.contains("show")));
    navigation?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setNavigation(false)));
    themeToggle?.addEventListener("click", () => setTheme({ system: "light", light: "dark", dark: "system" }[theme]));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navigation?.classList.contains("show")) {
        setNavigation(false);
        navToggle.focus();
      }
    });

    const toc = document.getElementById("toc-sidebar");
    const headings = toc ? Array.from(document.querySelectorAll(".cv h3.card-title")) : [];
    const tocLinks = [];
    if (toc) {
      toc.setAttribute("aria-label", "CV sections");
      toc.setAttribute("data-toggle", "toc");
      const list = document.createElement("ul");
      list.className = "nav navbar-nav";
      headings.forEach((heading) => {
        if (!heading.id) {
          const base =
            heading.textContent
              .trim()
              .toLowerCase()
              .replace(/'/g, "")
              .replace(/[^a-z0-9_-]+/g, "-")
              .slice(0, 64)
              .replace(/^-+|-+$/g, "") || "section";
          let id = base;
          for (let suffix = 1; document.getElementById(id); suffix++) id = `${base}-${suffix}`;
          heading.id = id;
        }
        const item = document.createElement("li");
        item.className = "nav-item";
        const link = document.createElement("a");
        link.className = "nav-link";
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent.trim();
        item.append(link);
        list.append(item);
        tocLinks.push(link);
      });
      toc.replaceChildren(list);
    }

    const backToTop = document.createElement("button");
    backToTop.id = "back-to-top";
    backToTop.type = "button";
    backToTop.hidden = true;
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"></path></svg>';
    backToTop.addEventListener("click", () =>
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      }),
    );
    document.body.append(backToTop);

    function updateScroll() {
      const height = navbar?.getBoundingClientRect().height || 56;
      document.body.style.paddingTop = `${height}px`;
      const distance = Math.max(0, root.scrollHeight - window.innerHeight);
      if (progress) {
        progress.style.top = `${height}px`;
        progress.max = distance || 1;
        progress.value = Math.min(distance, Math.max(0, window.scrollY));
        progress.setAttribute("aria-label", "Reading progress");
      }
      backToTop.hidden = window.scrollY < 1;
      const footer = document.querySelector("footer.fixed-bottom");
      if (footer) backToTop.style.bottom = `${footer.getBoundingClientRect().height + 15}px`;
      let active = 0;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= height + 20) active = index;
      });
      if (distance > 0 && window.scrollY >= distance - 2) active = headings.length - 1;
      tocLinks.forEach((link, index) => {
        link.classList.toggle("active", index === active);
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }

    let scrollPending = false;
    window.addEventListener(
      "scroll",
      () => {
        if (scrollPending) return;
        scrollPending = true;
        window.requestAnimationFrame(() => {
          updateScroll();
          scrollPending = false;
        });
      },
      { passive: true },
    );
    window.addEventListener("resize", updateScroll);
    window.addEventListener("load", updateScroll);
    updateScroll();

    const dialog = document.createElement("dialog");
    dialog.id = "site-search";
    dialog.setAttribute("aria-label", "Search site");
    dialog.innerHTML =
      '<div class="search-box"><input id="site-search-input" type="search" placeholder="Type to start searching" aria-label="Search pages and commands" role="combobox" aria-autocomplete="list" aria-controls="site-search-results" aria-expanded="true" autocomplete="off"><button type="button" class="search-close" aria-label="Close search">Esc</button></div><div id="site-search-results" role="listbox" aria-label="Search results"></div><footer class="search-hint">↑ ↓ to navigate · Enter to select · Esc to close</footer>';
    document.body.append(dialog);
    const input = dialog.querySelector("input");
    const results = dialog.querySelector("#site-search-results");
    const commands = [
      ...Array.from(navigation.querySelectorAll("a[data-title]"), (link) => ({
        title: link.dataset.title,
        description: link.dataset.description,
        section: "Navigation",
        href: link.href,
      })),
      { title: "Send email", section: "Socials", href: `mailto:${document.body.dataset.email}` },
      {
        title: "Change theme to light",
        description: "Change the theme of the site to Light",
        section: "Theme",
        theme: "light",
      },
      {
        title: "Change theme to dark",
        description: "Change the theme of the site to Dark",
        section: "Theme",
        theme: "dark",
      },
      {
        title: "Use system default theme",
        description: "Change the theme of the site to System Default",
        section: "Theme",
        theme: "system",
      },
    ];
    let filtered = [];
    let selected = 0;
    let previousFocus;

    function select(index) {
      selected = filtered.length ? (index + filtered.length) % filtered.length : 0;
      const options = results.querySelectorAll(".search-result");
      options.forEach((option, i) => {
        option.classList.toggle("active", i === selected);
        option.setAttribute("aria-selected", String(i === selected));
      });
      if (options[selected]) {
        input.setAttribute("aria-activedescendant", options[selected].id);
        options[selected].scrollIntoView({ block: "nearest" });
      } else input.removeAttribute("aria-activedescendant");
    }

    function execute(index) {
      const command = filtered[index];
      if (!command) return;
      dialog.close();
      if (command.theme) setTheme(command.theme);
      else window.location.href = command.href;
    }

    function renderResults() {
      const terms = input.value.trim().toLowerCase().split(/\s+/);
      filtered = commands.filter((command) =>
        terms.every((term) =>
          `${command.title} ${command.description || ""} ${command.section}`.toLowerCase().includes(term),
        ),
      );
      results.replaceChildren();
      let group;
      let section;
      filtered.forEach((command, index) => {
        if (section !== command.section) {
          section = command.section;
          group = document.createElement("section");
          group.className = "search-group";
          group.setAttribute("role", "group");
          const title = document.createElement("h2");
          title.className = "search-group-title";
          title.id = `search-group-${index}`;
          title.textContent = section;
          group.setAttribute("aria-labelledby", title.id);
          group.append(title);
          results.append(group);
        }
        const option = document.createElement("button");
        option.type = "button";
        option.className = "search-result";
        option.id = `search-result-${index}`;
        option.tabIndex = -1;
        option.setAttribute("role", "option");
        const title = document.createElement("span");
        title.className = "search-result-title";
        title.textContent = command.title;
        option.append(title);
        if (command.description) {
          const description = document.createElement("span");
          description.className = "search-result-description";
          description.textContent = command.description;
          option.append(description);
        }
        option.addEventListener("click", () => execute(index));
        group.append(option);
      });
      if (!filtered.length) {
        const empty = document.createElement("p");
        empty.className = "search-empty";
        empty.setAttribute("role", "status");
        empty.textContent = "No results found";
        results.append(empty);
      }
      select(0);
    }

    function openSearch() {
      if (dialog.open) return;
      previousFocus = document.activeElement;
      setNavigation(false);
      input.value = "";
      dialog.showModal();
      document.body.classList.add("search-open");
      renderResults();
      input.focus();
    }

    searchToggle?.addEventListener("click", openSearch);
    const shortcut = searchToggle?.querySelector(".nav-link");
    if (shortcut && /Mac|iPhone|iPad/.test(navigator.platform)) shortcut.firstChild.textContent = "⌘ k ";
    input.addEventListener("input", renderResults);
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        select(selected + (event.key === "ArrowDown" ? 1 : -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        execute(selected);
      }
    });
    dialog.querySelector(".search-close").addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        dialog.close();
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("search-open");
      if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus();
      else navToggle?.focus();
    });
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (dialog.open) dialog.close();
        else openSearch();
      }
    });
  });
})();
