// לוגו: שם + סמל (כמו ב-Figma). הסמל הוא public/logo-mark.svg
export function Logo({ size = 40 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="font-extrabold text-[22px] leading-none">רדאר מנויים</span>
      <img src={`${import.meta.env.BASE_URL}logo-mark.svg`} width={size} height={size} alt="" aria-hidden="true" />
    </span>
  )
}
