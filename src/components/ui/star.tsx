// Star.tsx
import React from "react";

type StarProps = {
  filled: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }: StarProps) => (
  <span
    onClick={onClick}
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave}
    style={{
      cursor: "pointer",
      fontSize: "24px",
      color: filled ? "gold" : "gray",
    }}
  >
    ★
  </span>
);

export default Star;
