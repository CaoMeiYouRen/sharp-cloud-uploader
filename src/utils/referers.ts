const referers = [
    {
        host: '.weibocdn.com',
        referer: 'https://weibo.com/',
    },
    {
        host: '.sinaimg.cn',
        referer: 'https://weibo.com/',
    },
    {
        host: '.sspai.com',
        referer: 'https://sspai.com/',
    },
    {
        host: '.pximg.net',
        referer: 'https://pixiv.net/',
    },
]
// 处理 Referer
export function getHeaders(url: string) {
    for (const referer of referers) {
        const urlObj = new URL(url)
        if (urlObj.host.endsWith(referer.host)) {
            return {
                referer: referer.referer,
            }
        }
    }
    return {}
}
