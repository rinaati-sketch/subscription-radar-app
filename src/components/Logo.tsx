// לוגו: סמל + לוגו טייפ מעוצב (public/logo.svg, מתוך תיקיית הלוגו logo-pro/SVG/radar-logo-web.svg)
// size הוא גובה הסמל; הלוגו המלא קצת גבוה ממנו בגלל התגית "מנויים"
const RATIO = 1672 / 630.96

export function Logo({ size = 40 }: { size?: number }) {
  const height = Math.round(size * 1.4)
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.svg`}
      width={Math.round(height * RATIO)}
      height={height}
      alt="רדאר מנויים"
    />
  )
}
