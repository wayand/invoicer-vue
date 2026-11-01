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

// The first and last day of a calendar year as yyyy-mm-dd
export const yearRange = (year) => ({ from: `${year}-01-01`, to: `${year}-12-31` })

// The first and last day of the calendar quarter that contains the day, as yyyy-mm-dd
export const quarterRange = (day = new Date()) => {
    const firstMonth = Math.floor(day.getMonth() / 3) * 3
    const last = new Date(day.getFullYear(), firstMonth + 3, 0)
    const pad = (value) => String(value).padStart(2, '0')
    return {
        from: `${day.getFullYear()}-${pad(firstMonth + 1)}-01`,
        to: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`,
    }
}

// The quarter before the one that contains the day
export const previousQuarterRange = (day = new Date()) =>
    quarterRange(new Date(day.getFullYear(), Math.floor(day.getMonth() / 3) * 3 - 1, 1))
