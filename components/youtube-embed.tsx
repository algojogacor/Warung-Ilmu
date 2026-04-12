import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

export function YouTubeEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <div className="my-4 rounded-xl overflow-hidden shadow-md">
      <LiteYouTubeEmbed
        id={id}
        title={title ?? 'YouTube video'}
        noCookie={true}
        poster="hqdefault"
      />
    </div>
  )
}
