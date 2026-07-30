/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, KeyRound, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { Button } from '@/components/ui/button'

import { CodeBlock } from './code-block'

const API_BASE_URL = 'https://russiaapi.com/v1'

export function Docs() {
  const { t } = useTranslation()

  const curlExample = `curl ${API_BASE_URL}/chat/completions \\
  -H "Authorization: Bearer sk-russiaapi-..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.4",
    "messages": [{"role": "user", "content": "Привет!"}]
  }'`

  const pythonExample = `from openai import OpenAI

client = OpenAI(
    api_key="sk-russiaapi-...",
    base_url="${API_BASE_URL}",
)

response = client.chat.completions.create(
    model="gpt-5.4",
    messages=[{"role": "user", "content": "Привет!"}],
)
print(response.choices[0].message.content)`

  const codexConfig = `model = "gpt-5.4"
model_provider = "russiaapi"

[model_providers.russiaapi]
name = "RussiaAPI"
base_url = "${API_BASE_URL}"
env_key = "RUSSIAAPI_API_KEY"
wire_api = "responses"`

  const claudeCodeConfig = `export ANTHROPIC_BASE_URL="https://russiaapi.com"
export ANTHROPIC_AUTH_TOKEN="sk-russiaapi-..."
export ANTHROPIC_MODEL="claude-sonnet-4-5"

claude`

  return (
    <PublicLayout showMainContainer={false}>
      <main className='pt-24'>
        <section className='border-b px-5 pb-12 sm:px-6'>
          <div className='mx-auto max-w-6xl'>
            <div className='text-primary mb-4 flex items-center gap-2 text-sm font-medium'>
              <BookOpen className='size-4' />
              RussiaAPI Docs
            </div>
            <h1 className='max-w-3xl text-4xl leading-tight font-semibold sm:text-5xl'>
              {t('docs.title')}
            </h1>
            <p className='text-muted-foreground mt-5 max-w-2xl text-base leading-7'>
              {t('docs.intro')}
            </p>
            <div className='mt-7 flex flex-wrap gap-3'>
              <Button render={<Link to='/sign-up' />}>
                {t('Create API key')}
                <ArrowRight />
              </Button>
              <Button variant='outline' render={<Link to='/pricing' />}>
                {t('View Pricing')}
              </Button>
            </div>
          </div>
        </section>

        <div className='mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]'>
          <nav className='hidden lg:block'>
            <div className='sticky top-24 grid gap-1 text-sm'>
              <a className='hover:bg-muted rounded-md px-3 py-2' href='#start'>
                {t('docs.quickStart')}
              </a>
              <a className='hover:bg-muted rounded-md px-3 py-2' href='#codex'>
                Codex CLI
              </a>
              <a className='hover:bg-muted rounded-md px-3 py-2' href='#claude'>
                Claude Code
              </a>
              <a className='hover:bg-muted rounded-md px-3 py-2' href='#errors'>
                {t('docs.troubleshooting')}
              </a>
            </div>
          </nav>

          <article className='min-w-0 space-y-16'>
            <section id='start' className='scroll-mt-24 space-y-6'>
              <div>
                <div className='text-primary mb-2 flex items-center gap-2 text-sm font-medium'>
                  <KeyRound className='size-4' />
                  OpenAI-compatible API
                </div>
                <h2 className='text-2xl font-semibold'>
                  {t('docs.quickStart')}
                </h2>
                <p className='text-muted-foreground mt-3 leading-7'>
                  {t('docs.quickStartDescription')}
                </p>
              </div>
              <div className='rounded-lg border p-4'>
                <div className='text-muted-foreground text-xs'>
                  {t('docs.baseUrl')}
                </div>
                <div className='mt-1 font-mono text-sm'>{API_BASE_URL}</div>
              </div>
              <CodeBlock code={curlExample} label='cURL' />
              <CodeBlock code={pythonExample} label='Python SDK' />
            </section>

            <section id='codex' className='scroll-mt-24 space-y-6'>
              <div>
                <div className='text-primary mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Terminal className='size-4' />
                  Codex CLI
                </div>
                <h2 className='text-2xl font-semibold'>
                  {t('docs.codexTitle')}
                </h2>
                <p className='text-muted-foreground mt-3 leading-7'>
                  {t('docs.codexDescription')}
                </p>
              </div>
              <ol className='list-decimal space-y-3 pl-5 text-sm leading-7'>
                <li>{t('docs.codexStepInstall')}</li>
                <li>{t('docs.codexStepConfig')}</li>
                <li>{t('docs.codexStepKey')}</li>
              </ol>
              <CodeBlock
                code='npm install -g @openai/codex'
                label={t('docs.installation')}
              />
              <CodeBlock code={codexConfig} label='~/.codex/config.toml' />
              <CodeBlock
                code={`export RUSSIAAPI_API_KEY="sk-russiaapi-..."\ncodex`}
                label={t('docs.launch')}
              />
              <p className='text-muted-foreground text-sm leading-6'>
                {t('docs.codexConfigWarning')}
              </p>
            </section>

            <section id='claude' className='scroll-mt-24 space-y-6'>
              <div>
                <div className='text-primary mb-2 flex items-center gap-2 text-sm font-medium'>
                  <Terminal className='size-4' />
                  Claude Code
                </div>
                <h2 className='text-2xl font-semibold'>
                  {t('docs.claudeTitle')}
                </h2>
                <p className='text-muted-foreground mt-3 leading-7'>
                  {t('docs.claudeDescription')}
                </p>
              </div>
              <CodeBlock
                code='npm install -g @anthropic-ai/claude-code'
                label={t('docs.installation')}
              />
              <CodeBlock
                code={claudeCodeConfig}
                label={t('docs.environment')}
              />
              <p className='text-muted-foreground text-sm leading-6'>
                {t('docs.modelAvailability')}
              </p>
            </section>

            <section id='errors' className='scroll-mt-24 space-y-5'>
              <h2 className='text-2xl font-semibold'>
                {t('docs.troubleshooting')}
              </h2>
              <div className='grid gap-3'>
                <div className='rounded-lg border p-4'>
                  <h3 className='font-medium'>401 Unauthorized</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {t('docs.error401')}
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <h3 className='font-medium'>429 Too Many Requests</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {t('docs.error429')}
                  </p>
                </div>
                <div className='rounded-lg border p-4'>
                  <h3 className='font-medium'>{t('docs.needHelp')}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {t('docs.needHelpDescription')}
                  </p>
                  <Button
                    className='mt-3'
                    variant='outline'
                    render={<Link to='/support' />}
                  >
                    {t('support.title')}
                  </Button>
                </div>
              </div>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </PublicLayout>
  )
}
