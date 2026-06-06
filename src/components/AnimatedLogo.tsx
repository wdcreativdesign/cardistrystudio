import { useRef, useState } from 'react'

interface Props {
  onEnded?: () => void
}

export function AnimatedLogo({ onEnded }: Props) {
  const [done, setDone] = useState(false)
  const videoRef        = useRef<HTMLVideoElement>(null)

  function handleEnded() {
    setDone(true)
    onEnded?.()
  }

  return (
    <div className="w-8 h-8 flex-shrink-0 relative">
      <img
        src="/favicon.svg"
        alt="CardistryStudio"
        className="w-8 h-8 absolute inset-0"
        style={{ opacity: done ? 1 : 0 }}
      />
      {!done && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={handleEnded}
          className="w-8 h-8 absolute inset-0 object-contain"
        >
          <source src="/logo-hevc-safari.mp4" type='video/mp4; codecs="hvc1"' />
          <source src="/logo.webm" type="video/webm" />
        </video>
      )}
    </div>
  )
}
