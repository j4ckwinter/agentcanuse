import { ArrowLeft, ImageOff } from 'lucide-react'
import { sitesWhereEnginesDisagree } from '../../core/agreement'
import type { EngineRun, Result, Run, Site } from '../../core/model'
import { OutcomeBadge } from '@/components/outcome-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { shotUrl } from '@/data'
import { ENGINE_NAMES, seconds } from '@/labels'

function resultFor(run: Run, site: string, engine: EngineRun): Result | undefined {
  return run.results.find((result) => result.site === site && result.engine === engine.id)
}

function SiteMatrix({ run, onOpen }: { run: Run; onOpen: (site: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Site</TableHead>
          {run.engines.map((engine) => (
            <TableHead key={engine.id}>{ENGINE_NAMES[engine.id]}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {run.sites.map((site) => (
          <TableRow key={site.id} className="cursor-pointer" onClick={() => onOpen(site.id)}>
            <TableCell>
              <div className="font-medium">{site.name}</div>
              <div className="text-xs text-muted-foreground">{new URL(site.url).hostname}</div>
            </TableCell>
            {run.engines.map((engine) => {
              const result = resultFor(run, site.id, engine)
              return <TableCell key={engine.id}>{result && <OutcomeBadge outcome={result.outcome} />}</TableCell>
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Screenshot({ result }: { result: Result }) {
  if (result.shot !== null) {
    return <img src={shotUrl(result.shot)} alt="" className="aspect-[8/5] w-full rounded-md border object-cover object-top" />
  }
  return (
    <div className="flex aspect-[8/5] w-full flex-col items-center justify-center gap-2 rounded-md border bg-muted p-4 text-center text-xs text-muted-foreground">
      <ImageOff className="size-5" />
      {result.excerpt === '' ? 'Nothing to show' : <p className="line-clamp-6 text-left">{result.excerpt}</p>}
    </div>
  )
}

function EngineCard({ engine, result }: { engine: EngineRun; result: Result }) {
  return (
    <Card size="sm" className="gap-3">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>
          {ENGINE_NAMES[engine.id]} <span className="font-mono text-xs font-normal text-muted-foreground">{engine.version}</span>
        </CardTitle>
        <OutcomeBadge outcome={result.outcome} />
      </CardHeader>
      <CardContent className="space-y-3">
        <Screenshot result={result} />
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-muted-foreground">Status</dt>
            <dd className="tabular-nums">{result.status ?? '–'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Time</dt>
            <dd className="tabular-nums">{seconds(result.durationMs || null)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Text</dt>
            <dd className="tabular-nums">{result.textLength.toLocaleString('en-GB')} chars</dd>
          </div>
        </dl>
        {result.missing.length > 0 && result.outcome !== 'skipped' && (
          <p className="text-xs text-muted-foreground">Missing: {result.missing.map((phrase) => `“${phrase}”`).join(', ')}</p>
        )}
        {result.error !== null && <p className="text-xs text-rose-700">{result.error}</p>}
      </CardContent>
    </Card>
  )
}

function SiteComparison({ run, site, onBack }: { run: Run; site: Site; onBack: () => void }) {
  const results = run.results.filter((result) => result.site === site.id)
  const agreed = !sitesWhereEnginesDisagree(results).has(site.id)
  const noScreenshots = results.every((result) => result.shot === null)
  return (
    <div className="space-y-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All sites
      </button>
      <div>
        <h2 className="text-xl font-semibold">{site.name}</h2>
        <a href={site.url} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          {site.url}
        </a>
        <p className="mt-1 text-sm text-muted-foreground">Expects: {site.expect.map((phrase) => `“${phrase}”`).join(', ')}</p>
      </div>
      {agreed && noScreenshots && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Every engine got the same result here, so no screenshots are kept. Screenshots are kept only where engines disagree.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {run.engines.map((engine) => {
          const result = resultFor(run, site.id, engine)
          return result && <EngineCard key={engine.id} engine={engine} result={result} />
        })}
      </div>
    </div>
  )
}

export function SitesView({ run, site, onOpen }: { run: Run; site: string | null; onOpen: (site: string | null) => void }) {
  const selected = run.sites.find((entry) => entry.id === site)
  if (selected === undefined) return <SiteMatrix run={run} onOpen={onOpen} />
  return <SiteComparison run={run} site={selected} onBack={() => onOpen(null)} />
}
