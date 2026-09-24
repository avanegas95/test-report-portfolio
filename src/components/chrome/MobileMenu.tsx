import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

interface SectionLink {
  id: string;
  number: string;
  label: string;
}

interface MobileMenuProps {
  sections: SectionLink[];
}

export default function MobileMenu({ sections }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(
    sections[0]?.number ?? "01",
  );
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const sectionElements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sectionElements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) {
          return;
        }

        const sectionId = visible[0]?.target.id;
        const match = sections.find((section) => section.id === sectionId);
        if (match) {
          setActiveSection(match.number);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const element of sectionElements) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, [closeMenu, isOpen]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((open) => !open);
    }
  };

  return (
    <div className="relative flex items-center gap-3 md:hidden">
      <span
        className="font-mono text-sm text-text-2"
        aria-live="polite"
        aria-atomic="true"
      >
        § {activeSection}
      </span>

      <button
        ref={menuButtonRef}
        type="button"
        className="inline-flex size-11 items-center justify-center rounded-md border border-border-control bg-paper text-ink"
        aria-label="Open sections menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={onMenuKeyDown}
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {isOpen ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>

      {isOpen && (
        <nav
          id={panelId}
          aria-label="Report sections"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[220px] rounded-lg border border-rule bg-paper py-2 shadow-lg"
        >
          <ul className="m-0 list-none p-0">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-center gap-2 px-4 py-3 text-sm text-text-2 no-underline hover:bg-paper-alt hover:text-ink"
                  onClick={closeMenu}
                >
                  <span className="font-mono text-faint">{section.number}</span>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
