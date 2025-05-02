import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  imgUrl: string;
  alt: string;
  value:string | number;
  title: string;
  textStyles: string;
  isAuthor?: boolean;
  href?: string;
  imgStyles?: string;
}

const Metric = ({
  imgUrl,
  alt,
  value,
  title,
  textStyles,
  isAuthor,
  href,
  imgStyles,
}: Props) => {
  const metricContent = (
    <>
      <Image
        src={imgUrl}
        height={20}
        width={20}
        alt={alt}
        className={`rounded-full object-content ${imgStyles}`}
      />
      <p className={`${textStyles} flex items-center gap-1`}>{value}
        <span className={`small-regular line-clamp-1 ${isAuthor?"max-sm:hidden":""}`}>{title}</span>
      </p>
    </>
  );

  return href ? (
    <Link href={href} className="flex-center gap-1">{metricContent}</Link>
  ) : (
    <div className="flex-center gap-1">{metricContent}</div>
  );
};

export default Metric;
