
export enum ItemType {
    Review = 'review',
    Watch = 'watch',
    List = 'list'
}

export interface RSSItem {
    type: ItemType
    starRating: string
    rewatch: boolean
    rating: number
    link: string
    pubDate: Date
    watchedOn?: Date | null
    creator: string
    guid: string
    posterImageUrl: string
    filmTitle: string
    filmYear: string
    review: string
    containsSpoilers: boolean
}

export function parseItem(item: any): RSSItem {
    let _item: RSSItem = item

    const typeMatch = (item.guid as string).match(/letterboxd-([a-z]+)/)
    if (typeMatch) {
        _item.type = typeMatch[1] as ItemType
    }

    const title = item.title as string
    let match = title.match(/(★|½)+/)
    _item.starRating = match ? match[0] : ""

    _item.rating = parseFloat(item.memberRating)
    _item.pubDate = new Date(Date.parse(item.pubDate))
    _item.rewatch = item.rewatch == 'Yes'
    if (item.watchedDate) {
        _item.watchedOn = new Date(Date.parse(item.watchedDate))
    }

    const posterImageMatch = (item.content as string).match(/src="(.+?)"/)
    if (posterImageMatch) {
        _item.posterImageUrl = posterImageMatch[1]
    }

    const spoilerMatch = title.match(/spoiler/)
    if (spoilerMatch) {
        _item.containsSpoilers = true
    }

    _item.review = item.contentSnippet
    return _item
}
