export function SmallScreenBlock() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#111] flex flex-col items-center justify-center px-8">

      {/* Center content */}
      <div className="flex flex-col items-center gap-10 w-full max-w-[320px]">
        <img src="/favicon.svg" alt="CardistryStudio" className="w-16 h-16" />

        <div className="flex flex-col gap-1 text-center">
          <p className="text-[12px] font-medium text-[#999]">Hi bruh,</p>
          <p className="text-[14px] font-medium text-white">This tool is not available on small devices.</p>
        </div>

        <a
          href="https://www.amazon.com/s?k=screen&i=computers&crid=378PWZT2HBRV1&sprefix=screen%2Ccomputers%2C178&ref=nb_sb_noss_1"
          target="_blank"
          rel="noopener noreferrer"
          className="h-[41px] px-6 bg-[#242424] hover:bg-[#2e2e2e] rounded-full flex items-center justify-center text-[16px] font-medium text-white transition-all active:scale-95"
        >
          Buy a screen
        </a>
      </div>

      {/* Footer */}
      <p className="absolute bottom-8 text-[14px] font-medium text-center">
        <span className="text-[#999]">Crafted by </span>
        <a
          href="https://www.linkedin.com/in/wylliam-duparc/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white underline hover:text-[#9ae600] transition-colors"
        >
          Wylliam Duparc
        </a>
      </p>

    </div>
  )
}
