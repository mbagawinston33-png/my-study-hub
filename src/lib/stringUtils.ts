/**
 * String utility functions for MyStudyHub
 */

/**
 * Auto-capitalizes text input
 * Capitalizes first letter of each word, handles proper nouns and acronyms
 *
 * @param text - Input text to capitalize
 * @returns Capitalized text
 */
export function autoCapitalize(text: string): string {
  if (!text || text.trim() === '') {
    return text;
  }

  return text
    .split(' ')
    .map(word => {
      if (word.trim() === '') {
        return word; // Preserve empty strings (multiple spaces)
      }

      // Handle subject codes with numbers (like MATH101, PHYS201)
      if (/\d/.test(word)) {
        return word.toUpperCase(); // Subject codes should be all caps
      }

      // Handle common acronyms and all-caps words
      if (isLikelyAcronym(word)) {
        return word.toUpperCase();
      }

      // Capitalize first letter of each word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Checks if a word is likely an acronym
 * Words that are 2-6 letters and all uppercase are treated as acronyms
 * Common academic codes like "MATH101", "PHYS201" are handled separately
 */
function isLikelyAcronym(word: string): boolean {
  // Check if word is all uppercase and short (likely acronym)
  // But exclude words that contain numbers (subject codes)
  return word.length >= 2 && word.length <= 6 &&
         word === word.toUpperCase() &&
         !/\d/.test(word); // No numbers in pure acronyms
}

/**
 * Real-time auto-capitalization for input fields
 * Converts text as user types, maintaining cursor position
 */
export function handleAutoCapitalize(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  shouldCapitalize: boolean = true
): string {
  const value = event.target.value;

  if (!shouldCapitalize) {
    return value;
  }

  const capitalized = autoCapitalize(value);

  // Only update if value actually changed to avoid cursor jumping
  if (capitalized !== value) {
    const selectionStart = event.target.selectionStart;
    const selectionEnd = event.target.selectionEnd;

    // Calculate new cursor position - handle spaces properly
    const selectionStartPos = selectionStart || 0;
    const selectionEndPos = selectionEnd || 0;
    const beforeCursor = value.substring(0, selectionStartPos);
    const beforeCursorCapitalized = autoCapitalize(beforeCursor);
    const cursorOffset = beforeCursorCapitalized.length - beforeCursor.length;
    const newCursorPosition = Math.max(0, selectionStartPos + cursorOffset);

    // Update value and restore cursor position
    event.target.value = capitalized;

    // Use setTimeout to ensure cursor position is set after React updates
    setTimeout(() => {
      event.target.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  }

  return capitalized;
}

/**
 * Capitalizes text without cursor preservation (for non-real-time updates)
 */
export function capitalizeText(text: string): string {
  return autoCapitalize(text);
}