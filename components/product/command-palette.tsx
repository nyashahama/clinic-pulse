"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CommandIcon,
  KeyRoundIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UserIcon,
  UserPlusIcon,
} from "lucide-react";

import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";

type CommandPaletteUser = {
  userId: number;
  email: string;
  displayName: string;
  role: string;
  disabledAt?: string | null;
};

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  onSelect: () => void;
};

type CommandPaletteProps = {
  users: CommandPaletteUser[];
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ users, open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const prevOpenRef = useRef(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  const filteredUsers = useMemo(() => {
    if (!query) return users.slice(0, 5);

    const lowerQuery = query.toLowerCase();
    return users
      .filter(
        (user) =>
          user.displayName.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          user.role.toLowerCase().replaceAll("_", " ").includes(lowerQuery)
      )
      .slice(0, 8);
  }, [users, query]);

  const items = useMemo((): CommandItem[] => {
    const globalItems: CommandItem[] = [
      {
        id: "create-user",
        label: "Create new user",
        description: "Add a pilot user to the organisation",
        icon: <UserPlusIcon className="size-4" />,
        onSelect: () => {
          router.push("/admin/users-roles#user-lifecycle-workspace");
          onClose();
        },
      },
      {
        id: "access-review",
        label: "Go to access review",
        description: "Review privileged roles and stale sessions",
        icon: <ShieldCheckIcon className="size-4" />,
        onSelect: () => {
          router.push("/admin/access-review");
          onClose();
        },
      },
      {
        id: "users-roles",
        label: "Go to users and roles",
        description: "Manage user access lifecycle",
        icon: <UserCogIcon className="size-4" />,
        onSelect: () => {
          router.push("/admin/users-roles");
          onClose();
        },
      },
    ];

    const userItems: CommandItem[] = filteredUsers.map((user) => ({
      id: `user-${user.userId}`,
      label: user.displayName,
      description: `${user.email} · ${user.role.replaceAll("_", " ")}${user.disabledAt ? " · Disabled" : ""}`,
      icon: <UserIcon className="size-4" />,
      onSelect: () => {
        if (expandedUserId === user.userId) {
          router.push(buildAdminUserDetailHref(user.userId, "command-palette"));
          onClose();
        } else {
          setExpandedUserId(user.userId);
          setSelectedIndex(0);
        }
      },
    }));

    if (expandedUserId) {
      const expandedUser = filteredUsers.find((u) => u.userId === expandedUserId);
      if (expandedUser) {
        return [
          {
            id: `view-${expandedUserId}`,
            label: `View ${expandedUser.displayName}`,
            description: "Open user detail page",
            icon: <UserIcon className="size-4" />,
            onSelect: () => {
              router.push(buildAdminUserDetailHref(expandedUserId, "command-palette"));
              onClose();
            },
          },
          {
            id: `sessions-${expandedUserId}`,
            label: "Revoke sessions",
            description: "Sign out all active sessions",
            icon: <KeyRoundIcon className="size-4" />,
            onSelect: () => {
              router.push(buildAdminUserDetailHref(expandedUserId, "command-palette"));
              onClose();
            },
          },
        ];
      }
    }

    return query
      ? [...userItems, ...globalItems]
      : [...globalItems, ...userItems];
  }, [filteredUsers, query, router, onClose, expandedUserId]);

  const totalItems = items.length;

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    setExpandedUserId(null);
  }, []);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setQuery("");
      setSelectedIndex(0);
      setExpandedUserId(null);
      inputRef.current?.focus();
    }
    prevOpenRef.current = open;
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        items[selectedIndex]?.onSelect();
      } else if (e.key === "Escape") {
        if (expandedUserId) {
          setExpandedUserId(null);
          setSelectedIndex(0);
        } else {
          onClose();
        }
      }
    },
    [items, selectedIndex, totalItems, onClose, expandedUserId]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-border-subtle bg-bg-default shadow-2xl">
        <div className="flex items-center border-b border-border-subtle px-4">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search users, actions, or pages..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="flex items-center gap-1 rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
          >
            <span>Esc</span>
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-1">
              {expandedUserId && (
                <button
                  onClick={() => {
                    setExpandedUserId(null);
                    setSelectedIndex(0);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowRightIcon className="size-3 rotate-180" />
                  Back to all results
                </button>
              )}
              {!query && !expandedUserId && (
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Quick actions
                </p>
              )}
              {query && !expandedUserId && (
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {filteredUsers.length > 0 ? "Users" : "Actions"}
                </p>
              )}
              {items.map((item, index) => (
                <button
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  }`}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-muted text-muted-foreground">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{item.label}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded-md border border-border-subtle bg-bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Esc
              </kbd>
              Close
            </span>
          </div>
          <span className="hidden sm:inline">
            <CommandIcon className="inline size-3" /> K to open
          </span>
        </div>
      </div>
    </div>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen };
}
