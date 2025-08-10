import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import * as React from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleEnterKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
  if (e.key === 'Enter' && e.target instanceof HTMLElement) {
    // Prevent default form submission on Enter key
    if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
       e.preventDefault();
    } else {
        return
    }


    const form = e.currentTarget;
    const focusable = Array.from(
      form.querySelectorAll(
        'input:not([disabled]), select, textarea, button, [role="combobox"], [role="button"]'
      )
    ).filter(
      (el) =>
        (el as HTMLElement).offsetParent !== null && // is visible
        !(el as HTMLElement).hasAttribute('data-disabled')
    ) as HTMLElement[];
    
    const index = focusable.indexOf(e.target as HTMLElement);

    if (index > -1 && index < focusable.length - 1) {
      const nextElement = focusable[index + 1];
      if (nextElement) {
        nextElement.focus();
      }
    }
  }
}
