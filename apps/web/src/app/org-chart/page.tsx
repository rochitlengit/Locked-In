'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import AppShell from '@/components/AppShell';
import { Card, Empty, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';

const ROLE_COLOURS: Record<string, string> = {
  SUPER_ADMIN: '#0B6BE0',
  HR: '#7A3FA6',
  TEAM_LEAD: '#233CA6',
  EMPLOYEE: '#1E7F55',
};

export default function OrgChartPage() {
  const [theme] = useTheme();
  const [roots, setRoots] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    api.get('/org-chart').then((r) => setRoots(r.data));
  }, []);

  useEffect(() => {
    if (!svgRef.current || roots.length === 0) return;
    const dark = theme === 'dark';
    const linkColour = dark ? '#3A322B' : '#D7D1C6';
    const cardFill = dark ? '#201C19' : '#FDFCFA';
    const nameColour = dark ? '#F3EFE8' : '#1E2024';
    const roleColour = dark ? '#8A8172' : '#8A8D94';

    const data = roots.length === 1 ? roots[0] : { fullName: 'Organization', role: 'SUPER_ADMIN', children: roots };
    const root = d3.hierarchy<any>(data, (d) => d.children);

    const nodeWidth = 150;
    const levelHeight = 110;
    const leaves = root.leaves().length;
    const width = Math.max(900, leaves * nodeWidth);
    const height = (root.height + 1) * levelHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${width + 80} ${height + 60}`);

    d3.tree<any>().size([width, height - 40])(root);

    const g = svg.append('g').attr('transform', 'translate(40,30)');

    g.selectAll('path.link')
      .data(root.links())
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', linkColour)
      .attr('stroke-width', 1.25)
      .attr(
        'd',
        d3
          .linkVertical<any, any>()
          .x((d: any) => d.x)
          .y((d: any) => d.y) as any,
      );

    const node = g
      .selectAll('g.node')
      .data(root.descendants())
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

    node
      .append('rect')
      .attr('x', -62)
      .attr('y', -20)
      .attr('width', 124)
      .attr('height', 42)
      .attr('rx', 9)
      .attr('fill', cardFill)
      .attr('stroke', (d: any) => ROLE_COLOURS[d.data.role] || linkColour)
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', 1.4);

    // Role accent along the left edge of each card.
    node
      .append('rect')
      .attr('x', -62)
      .attr('y', -20)
      .attr('width', 3)
      .attr('height', 42)
      .attr('rx', 1.5)
      .attr('fill', (d: any) => ROLE_COLOURS[d.data.role] || linkColour);

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -3)
      .attr('font-size', 11)
      .attr('font-weight', 500)
      .attr('fill', nameColour)
      .text((d: any) => (d.data.fullName || '').slice(0, 18));

    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 11)
      .attr('font-size', 9)
      .attr('fill', roleColour)
      .text((d: any) => (d.data.title || d.data.role || '').slice(0, 24));
  }, [roots, theme]);

  return (
    <AppShell>
      <PageHeader
        title="Organization Chart"
        subtitle="Reporting lines across the company, built from each person's manager."
      />
      <Card>
        {roots.length === 0 ? (
          <Empty>No people yet — add them from the Admin console.</Empty>
        ) : (
          <>
            <div className="flex gap-4 text-[11px] text-gray-500 mb-3">
              {Object.entries(ROLE_COLOURS).map(([role, colour]) => (
                <span key={role} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: colour }}
                  />
                  {role.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </div>
            <div className="overflow-x-auto">
              <svg ref={svgRef} className="w-full" style={{ minHeight: 420, minWidth: 900 }} />
            </div>
          </>
        )}
      </Card>
    </AppShell>
  );
}
