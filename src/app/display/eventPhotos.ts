/**
 * Event imagery under `public/assets/aif-events-photos/`.
 * `main-1.jpg` reads well as hero; remaining files roughly follow order.
 */
export const EVENT_PHOTOS_BASE_PATH = "/assets/aif-events-photos";

export const EVENT_PHOTO_FILES = [
  "main-1.jpg",
  "1.jpg",
  "2.JPG",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "7.jpg",
  "8.jpg",
  "9.JPG",
  "10.JPG",
  "11.JPG",
  "12.JPG",
  "13.jpg",
  "14.jpg",
  "15.jpg",
  "16.jpg",
  "17.jpg",
  "18.jpg",
  "19.jpg",
  "20.jpg",
  "21.jpg",
  "22.jpg",
  "23.jpg",
  "24.jpg",
  "25.jpg",
  "26.jpg",
  "27.jpg",
] as const;

export function eventPhotoSrc(file: (typeof EVENT_PHOTO_FILES)[number]) {
  return `${EVENT_PHOTOS_BASE_PATH}/${file}`;
}
