
export enum ItemType {
    Review = 'review',
    Watch = 'watch',
    List = 'list'
}

export interface RSSItem {
    type: ItemType
    rewatch: boolean
    rating: number
    liked: boolean
    link: string
    pubDate: Date
    watchedOn: Date | null
    creator: string
    guid: string
    posterImageUrl: string
    filmTitle: string
    filmYear: string
    review: string
    containsSpoilers: boolean
}

export function parseItem(item: any): RSSItem {
    // Build fresh — the parser's raw item carries large fields (CDATA `content`,
    // `description`, ...) that mutating-and-returning kept alive per RSSItem.
    const title = typeof item.title === "string" ? item.title : ""
    const guid = typeof item.guid === "string" ? item.guid : ""
    const content = typeof item.content === "string" ? item.content : ""
    const typeMatch = guid.match(/letterboxd-([a-z]+)/)
    const posterImageMatch = content.match(/src="(.+?)"/)

    const out = {
        rewatch: item.rewatch == 'Yes',
        rating: parseFloat(item.memberRating),
        liked: item.memberLike == 'Yes',
        link: item.link,
        pubDate: new Date(Date.parse(item.pubDate)),
        watchedOn: item.watchedDate ? new Date(Date.parse(item.watchedDate)) : null,
        creator: item.creator,
        guid: item.guid,
        posterImageUrl: posterImageMatch ? posterImageMatch[1] : "",
        filmTitle: item.filmTitle,
        filmYear: item.filmYear,
        review: item.contentSnippet,
        containsSpoilers: /spoiler/.test(title),
    } as RSSItem

    if (typeMatch) {
        out.type = typeMatch[1] as ItemType
    }

    return out
}
