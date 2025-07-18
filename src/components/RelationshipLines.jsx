import React from 'react';
import { CARD_WIDTH, CARD_HEIGHT } from './constants';

// Helper to get unique partner groups (arrays of member ids)
function getPartnerGroups(members) {
  const visited = new Set();
  const groups = [];
  members.forEach(member => {
    if (member.partners && member.partners.length > 0) {
      const group = [member.id, ...member.partners].sort();
      const key = group.join('-');
      if (!visited.has(key)) {
        groups.push(group);
        visited.add(key);
      }
    }
  });
  return groups;
}

export default function RelationshipLines({ members, positions }) {
  const partnerLines = [];
  const childLines = [];

  // Draw horizontal lines between all partners in a group
  const partnerGroups = getPartnerGroups(members);
  partnerGroups.forEach((group, groupIdx) => {
    // Get positions for all partners in the group
    const groupPositions = group
      .map(id => positions[id])
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);
    if (groupPositions.length < 2) return;
    // Draw horizontal line connecting centers of all partner cards
    for (let i = 0; i < groupPositions.length - 1; i++) {
      const a = groupPositions[i];
      const b = groupPositions[i + 1];
      const y = (a.y + b.y) / 2; // average y (should be the same)
      partnerLines.push(
        <line
          key={`partner-${group.join('-')}-${i}`}
          x1={a.x}
          y1={y}
          x2={b.x}
          y2={y}
          stroke="#888"
          strokeWidth="2"
        />
      );
    }
  });

  // Draw parent-child lines for each partner group with children
  partnerGroups.forEach((group, groupIdx) => {
    // Find all children for this group (children who have all group members as parents)
    const groupSet = new Set(group);
    const children = members.filter(
      m => m.parents && group.every(pid => m.parents.includes(pid))
    );
    if (children.length === 0) return;
    // Get positions for all partners in the group
    const groupPositions = group
      .map(id => positions[id])
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);
    if (groupPositions.length === 0) return;
    // Midpoint of partner line
    const minX = groupPositions[0].x;
    const maxX = groupPositions[groupPositions.length - 1].x;
    const y = groupPositions[0].y; // assume same row
    const midX = (minX + maxX) / 2;
    // The junction for children is a fixed distance below the partner line
    const junctionY = y + CARD_HEIGHT / 2 + 32;
    // Draw vertical line from partner line to junction
    childLines.push(
      <line
        key={`parent-junction-${group.join('-')}`}
        x1={midX}
        y1={y}
        x2={midX}
        y2={junctionY}
        stroke="#888"
        strokeWidth="2"
      />
    );
    // Get all child positions
    const childPositions = children
      .map(child => positions[child.id])
      .filter(Boolean)
      .sort((a, b) => a.x - b.x);
    if (childPositions.length > 1) {
      const minChildX = childPositions[0].x;
      const maxChildX = childPositions[childPositions.length - 1].x;
      // Draw horizontal line at junction level
      childLines.push(
        <line
          key={`junction-horizontal-${group.join('-')}`}
          x1={minChildX}
          y1={junctionY}
          x2={maxChildX}
          y2={junctionY}
          stroke="#888"
          strokeWidth="2"
        />
      );
    }
    // Draw vertical lines from junction to the top edge of each child card
    childPositions.forEach((childPos, idx) => {
      const childCardHeight = childPos.height || CARD_HEIGHT;
      const childTopEdge = childPos.y - childCardHeight / 2;
      childLines.push(
        <line
          key={`junction-child-${group.join('-')}-${idx}`}
          x1={childPos.x}
          y1={junctionY}
          x2={childPos.x}
          y2={childTopEdge}
          stroke="#888"
          strokeWidth="2"
        />
      );
    });
  });

  return (
    <>
      {/* Partner lines behind cards */}
      <svg
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0
        }}
      >
        {partnerLines}
      </svg>
      {/* Child lines in front of cards */}
      <svg
        style={{
          position: 'absolute',
          top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 20
        }}
      >
        {childLines}
      </svg>
    </>
  );
}