"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightIcon,
  SearchIcon,
  ShieldCheckIcon,
  UserCogIcon,
  UserIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { buildAdminUserDetailHref } from "@/lib/product/admin-detail-routes";
import { cn } from "@/lib/utils";

type CommandPaletteUser = {
  userId: number;
  email: string;
  displayName: string;
  role: string;
  disabledAt?: string | null;
};

type CommandAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  shortcut?: string;
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
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredUsers = useMemo(() => {
    if (!query) return users.slice(0, 5);

    const lowerQuery = query.toLowerCase();
    return users
      .filter(
        (user) =>
          user.displayName.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery) ||
          user.role.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 10);
  }, [users, query]);

  const actions: CommandAction[] = useMemo(() => {
    const userActions: CommandAction[] = filteredUsers.map((user) => ({
      id: `user-${user.userId}`,
      label: user.displayName,
      icon: <UserIcon className="size-4" />,
      href: buildAdminUserDetailHref(user.userId, "command-palette"),
      shortcut: "Enter",
      onSelect: () => {
        router.push(buildAdminUserDetailHref(user.userId, "command-palette"));
        onClose();
      },
    }));

    const globalActions: CommandAction[] = [
      {
        id: "create-user",
        label: "Create new user",
        icon: <UserPlusIcon className="size-4" />,
        href: "#user-lifecycle-workspace",
        shortcut: "N",
        onSelect: () => {
          router.push("/admin/users-roles#user-lifecycle-workspace");
          onClose();
        },
      },
      {
        id: "access-review",
        label: "Go to access review",
        icon: <ShieldCheckIcon className="size-4" />,
        href: "/admin/access-review",
        shortcut: "A",
        onSelect: () => {
          router.push("/admin/access-review");
          onClose();
        },
      },
      {
        id: "user-lifecycle",
        label: "Go to user lifecycle",
        icon: <UserCogIcon className="size-4" />,
        href: "/admin/users-roles",
        shortcut: "U",
        onSelect: () => {
          router.push("/admin/users-roles");
          onClose();
        },
      },
    ];

    return query ? [...userActions, ...globalActions] : [...globalActions, ...userActions];
  }, [filteredUsers, query, router, onClose]);

  const totalItems = actions.length;

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
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
        actions[selectedIndex]?.onSelect();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [actions, selectedIndex, totalItems, onClose]
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <XIcon className="size-3" />
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {actions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-1">
              {!query && (
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Quick actions
                </p>
              )}
              {actions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={action.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left transition-colors",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-accent/50"
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-bg-muted text-muted-foreground">
                    {action.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{action.label}</p>
                    {"role" in action && action.id.startsWith("user-") && (
                      <p className="truncate text-xs text-muted-foreground">
                        {users.find((u) => u.userId === Number(action.id.split("-")[1]))?.email}
                      </p>
                    )}
                  </div>
                  {action.href && (
                    <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
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
          <span>{totalItems} result{totalItems !== 1 ? "s" : ""}</span>
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
