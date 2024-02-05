import * as React from 'react';

interface IIconProps {
  url?: string;
  type?: string;
}

const Icons: React.FC<IIconProps> = ({ url, type }) => {
  if (url) {
    return <img src={url} alt="Icon" />;
  } else if (type) {
    return <span className={`icon-${type}`}>Icon Here</span>;
  } else {
    return null; // No icon provided
  }
};

export default Icons;
