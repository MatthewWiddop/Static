import { calcBlockIndent, countLeadingSpaces } from '../utils.ts';

export type BulletListMarker = '-' | '+' | '*';
export type OrderedListMarker = '.' | ')';
export type ListMarker = BulletListMarker | OrderedListMarker;

const ORDERED_MARKERS = [ '-', '+', '*' ];
const MARKER_REGEX = /^( {0,3})([-+*]|\d{1,9}[.)])(.*)$/;

export interface ParsedListMarker {
  ordered: boolean;
  marker: ListMarker;
  start: number | null;
  indent: number;
  markerWidth: number;
  padding: number;
  contentIndent: number;
}

export class Marker {
  static parse(text: string): ParsedListMarker | null {
    const match = text.match(MARKER_REGEX);
    if (!match) return null;

    const [, leadingSpaces, fullMarker, remaining] = match;
    const indent = leadingSpaces.length;
    const marker = fullMarker.at(-1) as ListMarker;
    const ordered = ORDERED_MARKERS.includes(marker);
    const start = ordered ? Number(marker.slice(0, fullMarker.length)) : null;
    const markerWidth = fullMarker.length;

    const spaces = countLeadingSpaces(remaining);
    const padding = calcBlockIndent(spaces);
    if (padding === 0 && remaining.length > 0) {
      return null ;
    }

    return {
      ordered,
      marker,
      start, // TODO: fix this being NaN on '-' marker
      indent,
      markerWidth,
      padding,
      contentIndent: indent + markerWidth + padding,
    };
  }

  static same(a: ParsedListMarker, b: ParsedListMarker): boolean {
    return a.marker === b.marker && a.ordered === b.ordered;
  }
}

