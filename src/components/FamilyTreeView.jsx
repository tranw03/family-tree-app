import React, { useRef, useState, useLayoutEffect } from 'react';
import MemberCard from './MemberCard';
import RelationshipLines from './RelationshipLines';

export default function FamilyTreeView({ members, onSelectMember }) {
  const containerRef = useRef(null);
  const cardRefs = useRef(new Map());
  const [positions, setPositions] = useState({});

  useLayoutEffect(() => {
    let frame = 0;
    let rafId;

    function calculatePositions() {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newPositions = {};
      cardRefs.current.forEach((node, id) => {
        if (node) {
          const rect = node.getBoundingClientRect();
          newPositions[id] = {
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top + rect.height / 2,
            top: rect.top - containerRect.top,
            bottom: rect.top - containerRect.top + rect.height,
            height: rect.height
          };
        }
      });
      setPositions(newPositions);

      // Recalculate for a few frames to ensure layout is stable
      if (frame < 5) {
        frame++;
        rafId = requestAnimationFrame(calculatePositions);
      }
    }

    calculatePositions();
    window.addEventListener('resize', calculatePositions);

    return () => {
      window.removeEventListener('resize', calculatePositions);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [members]);


    // Helper to build rows
    function buildRows(members) {
      const idToMember = Object.fromEntries(members.map(m => [m.id, m]));
      const allChildIds = new Set(members.flatMap(m => m.children || []));
      const roots = members.filter(m => !allChildIds.has(m.id));
      const rows = [];
      let currentRow = roots;
      let seen = new Set(roots.map(m => m.id));
    
      while (currentRow.length > 0) {
        // Group partners together
        const grouped = [];
        const used = new Set();
        currentRow.forEach(m => {
          if (used.has(m.id)) return;
          // Find all partners of m in currentRow
          const partnersInRow = (m.partners || [])
            .map(pid => idToMember[pid])
            .filter(p => p && currentRow.some(x => x.id === p.id) && !used.has(p.id));
          if (partnersInRow.length > 0) {
            const group = [m, ...partnersInRow];
            group.forEach(x => used.add(x.id));
            grouped.push(group);
          } else {
            grouped.push([m]);
            used.add(m.id);
          }
        });
        rows.push(grouped);
    
        // Find all unique children of currentRow members
        const nextRowIds = [
          ...new Set(currentRow.flatMap(m => m.children || []))
        ].filter(id => !seen.has(id));
        const nextRow = nextRowIds.map(id => idToMember[id]).filter(Boolean);
        nextRow.forEach(m => seen.add(m.id));
        currentRow = nextRow;
      }
      return rows;
    }

    // Remove all generation logic and grouping
    // Render all members in a single grid
    const rows = buildRows(members);

    return (
        <div className="relative" ref={containerRef}>
            <RelationshipLines members={members} positions={positions} />
            <div className="space-y-16">
              {rows.map((row, i) => (
                <div key={i} className="flex flex-wrap justify-center gap-x-16 gap-y-32">
                  {row.map((group, j) =>
                    group.length > 1 ? (
                      <React.Fragment key={group.map(x => x.id).join('-')}>
                        {group.map(partner => (
                          <MemberCard
                            key={partner.id}
                            member={partner}
                            onSelectMember={onSelectMember}
                            ref={node => {
                              if (node) cardRefs.current.set(partner.id, node);
                              else cardRefs.current.delete(partner.id);
                            }}
                          />
                        ))}
                      </React.Fragment>
                    ) : (
                      <MemberCard
                        key={group[0].id}
                        member={group[0]}
                        onSelectMember={onSelectMember}
                        ref={node => {
                          if (node) cardRefs.current.set(group[0].id, node);
                          else cardRefs.current.delete(group[0].id);
                        }}
                      />
                    )
                  )}
                </div>
              ))}
            </div>
        </div>
    );
}
