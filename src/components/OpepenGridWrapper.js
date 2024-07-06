import React, { useMemo } from 'react';
import OpepenGrid from './OpepenGrid';

const OpepenGridWrapper = ({ rows, imageSize, margin }) => {
  const gridComponent = useMemo(() => (
    <OpepenGrid rows={rows} imageSize={imageSize} margin={margin} />
  ), [rows, imageSize, margin]);

  return gridComponent;
};

export default React.memo(OpepenGridWrapper);
