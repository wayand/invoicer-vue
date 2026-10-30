import { DateTime } from 'luxon'

export default function MyDatetimeObject() {
    const newUTCDate = (utcDate) =>
        new Date(
            Date.UTC(
                utcDate.getFullYear(),
                utcDate.getMonth(),
                utcDate.getDate(),
                utcDate.getHours(),
                utcDate.getMinutes(),
            ),
        )

    const luxon = (date = false) => {
        if (!date) {
            date = new Date()
        }
        const utcDate = new Date(date)
        return DateTime.fromJSDate(newUTCDate(utcDate))
    }

    const relativeDate = (dateString = false) => {
        const utcDate = new Date(dateString)
        return DateTime.fromJSDate(newUTCDate(utcDate)).setZone('Europe/Copenhagen').toRelative()
    }

    const toLocaleString = (dateString = false) => {
        const utcDate = new Date(dateString)
        return DateTime.fromJSDate(newUTCDate(utcDate)).setZone('Europe/Copenhagen').toString()
    }

    return {
        luxon,
        relativeDate,
        toLocaleString,
    }
}

// Today as yyyy-mm-dd in the local time zone (toISOString would give the UTC date)
export const todayIso = (now = new Date()) =>
    [now.getFullYear(), now.getMonth() + 1, now.getDate()]
        .map((part, i) => String(part).padStart(i ? 2 : 4, '0'))
        .join('-')
