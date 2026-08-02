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
import {
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Film,
  ImagePlus,
  LoaderCircle,
  Play,
  RotateCcw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { createVideoGeneration, getVideoGeneration } from '../../api'
import type { GroupOption, ModelOption, VideoTask } from '../../types'

type VideoModelConfig = {
  id: string
  provider: string
  label: string
  durations: number[]
  sizes: { label: string; value: string }[]
  modes?: { label: string; value: string }[]
  supportsImage: boolean
}

const LANDSCAPE = { label: '16:9 · 1280×720', value: '1280x720' }
const PORTRAIT = { label: '9:16 · 720×1280', value: '720x1280' }
const SQUARE = { label: '1:1 · 1024×1024', value: '1024x1024' }
const RESOLUTIONS = [LANDSCAPE, PORTRAIT, SQUARE]

const VIDEO_MODELS: VideoModelConfig[] = [
  ...['MiniMax-Hailuo-2.3', 'MiniMax-Hailuo-2.3-Fast'].map((id) => ({
    id,
    provider: 'Hailuo',
    label: id.replace('MiniMax-', ''),
    durations: [6, 10],
    sizes: [
      { label: '768p', value: '768p' },
      { label: '1080p', value: '1080p' },
    ],
    supportsImage: true,
  })),
  {
    id: 'doubao-seedance-1-5-pro-251215',
    provider: 'Seedance',
    label: 'Seedance 1.5 Pro',
    durations: [5, 10],
    sizes: [
      { label: '720p', value: '720p' },
      { label: '1080p', value: '1080p' },
    ],
    supportsImage: true,
  },
  ...[
    'wanx2.1-t2v-turbo',
    'wanx2.1-i2v-turbo',
    'wan2.2-t2v-plus',
    'wan2.2-i2v-flash',
    'wan2.5-t2v-preview',
    'wan2.5-i2v-preview',
  ].map((id) => ({
    id,
    provider: 'Wan',
    label: id,
    durations: [5, 10],
    sizes: RESOLUTIONS,
    supportsImage: id.includes('i2v'),
  })),
  {
    id: 'viduq2',
    provider: 'Vidu',
    label: 'Vidu Q2',
    durations: [5, 8, 10],
    sizes: [
      { label: '720p', value: '720p' },
      { label: '1080p', value: '1080p' },
    ],
    supportsImage: true,
  },
  ...['kling-v1', 'kling-v1-6', 'kling-v2-master'].map((id) => ({
    id,
    provider: 'Kling',
    label: id.replace('kling-', 'Kling '),
    durations: [5, 10],
    sizes: RESOLUTIONS,
    modes: [
      { label: 'Standard', value: 'std' },
      { label: 'Professional', value: 'pro' },
    ],
    supportsImage: true,
  })),
]

const TERMINAL_STATUSES = new Set(['SUCCESS', 'FAILURE'])
const SUCCESS_STATUSES = new Set(['SUCCESS', 'SUCCEEDED', 'COMPLETED'])

function parseProgress(progress?: string) {
  const value = Number.parseInt(progress ?? '0', 10)
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}

function getErrorMessage(error: unknown) {
  if (typeof error !== 'object' || error === null) return String(error)
  const candidate = error as {
    response?: { data?: { message?: string; error?: { message?: string } } }
    message?: string
  }
  return (
    candidate.response?.data?.error?.message ??
    candidate.response?.data?.message ??
    candidate.message ??
    'Video generation failed'
  )
}

type PlaygroundVideoProps = {
  models: ModelOption[]
  groups: GroupOption[]
  group: string
  onGroupChange: (group: string) => void
  isModelLoading: boolean
}

export function PlaygroundVideo({
  models,
  groups,
  group,
  onGroupChange,
  isModelLoading,
}: PlaygroundVideoProps) {
  const { t } = useTranslation()
  const availableModels = useMemo(() => {
    const allowed = new Set(models.map((model) => model.value))
    return VIDEO_MODELS.filter((model) => allowed.has(model.id))
  }, [models])
  const providers = useMemo(
    () => [...new Set(availableModels.map((model) => model.provider))],
    [availableModels]
  )

  const [modelId, setModelId] = useState('')
  const model =
    availableModels.find((candidate) => candidate.id === modelId) ??
    availableModels[0]
  const [prompt, setPrompt] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [duration, setDuration] = useState(5)
  const [size, setSize] = useState(LANDSCAPE.value)
  const [mode, setMode] = useState('std')
  const [task, setTask] = useState<VideoTask | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!model) return
    setModelId(model.id)
    setDuration(model.durations[0])
    setSize(model.sizes[0].value)
    setMode(model.modes?.[0].value ?? 'std')
  }, [model])

  useEffect(() => {
    if (!task?.task_id || TERMINAL_STATUSES.has(task.status)) return

    let cancelled = false
    const controller = new AbortController()
    const poll = async () => {
      try {
        const nextTask = await getVideoGeneration(
          task.task_id,
          controller.signal
        )
        if (!cancelled) setTask(nextTask)
      } catch (error) {
        if (!controller.signal.aborted) toast.error(getErrorMessage(error))
      }
    }
    const timer = window.setInterval(() => void poll(), 5000)
    void poll()
    return () => {
      cancelled = true
      controller.abort()
      window.clearInterval(timer)
    }
  }, [task?.task_id, task?.status])

  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    []
  )

  const isComplete = Boolean(task && SUCCESS_STATUSES.has(task.status))
  const isFailed = task?.status === 'FAILURE'
  const progress = isComplete ? 100 : parseProgress(task?.progress)
  const contentUrl = task ? `/v1/videos/${task.task_id}/content` : ''
  let statusBadgeVariant: 'destructive' | 'secondary' | 'outline' = 'outline'
  if (isFailed) statusBadgeVariant = 'destructive'
  if (isComplete) statusBadgeVariant = 'secondary'
  let statusIcon = <Clock3 className='size-6' />
  if (task?.status === 'IN_PROGRESS') {
    statusIcon = <LoaderCircle className='size-6 animate-spin' />
  }
  if (isFailed) statusIcon = <TriangleAlert className='size-6' />

  const handleSubmit = async () => {
    if (!model || !prompt.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsSubmitting(true)
    setTask(null)

    try {
      const images = imageUrl.trim() ? [imageUrl.trim()] : undefined
      const response = await createVideoGeneration(
        {
          model: model.id,
          group,
          prompt: prompt.trim(),
          image: imageUrl.trim() || undefined,
          images,
          duration,
          seconds: String(duration),
          size,
          mode: model.modes ? mode : undefined,
          metadata:
            model.provider === 'Seedance' ? { resolution: size } : undefined,
        },
        controller.signal
      )
      const taskId = response.task_id ?? response.id
      if (!taskId) throw new Error(response.error?.message ?? 'Missing task ID')
      setTask({
        task_id: taskId,
        status: response.status?.toUpperCase() ?? 'SUBMITTED',
        progress: '0%',
      })
      toast.success(t('Video task submitted'))
    } catch (error) {
      if (!controller.signal.aborted) toast.error(getErrorMessage(error))
    } finally {
      if (!controller.signal.aborted) setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    abortRef.current?.abort()
    setTask(null)
    setPrompt('')
    setImageUrl('')
    setIsSubmitting(false)
  }

  return (
    <div className='size-full overflow-y-auto'>
      <div className='mx-auto grid min-h-full w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,0.88fr)_minmax(440px,1.12fr)] lg:px-8 lg:py-8'>
        <section className='flex min-w-0 flex-col gap-5'>
          <div>
            <Badge variant='outline' className='mb-3 gap-1.5'>
              <Sparkles className='size-3' />
              {t('RussiaAPI video studio')}
            </Badge>
            <h1 className='text-2xl font-semibold tracking-normal'>
              {t('Generate video from one prompt')}
            </h1>
            <p className='text-muted-foreground mt-2 max-w-xl text-sm leading-6'>
              {t(
                'Choose among leading Chinese video models, submit a task, and preview the result without leaving the console.'
              )}
            </p>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label>{t('Routing group')}</Label>
              <Select
                value={group}
                onValueChange={(value) => value && onGroupChange(value)}
              >
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>{t('Video model')}</Label>
              <Select
                value={model?.id ?? ''}
                onValueChange={(value) => value && setModelId(value)}
                disabled={isModelLoading || availableModels.length === 0}
              >
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue placeholder={t('Select a video model')} />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectGroup key={provider}>
                      <SelectLabel>{provider}</SelectLabel>
                      {availableModels
                        .filter((item) => item.provider === provider)
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-2'>
            <div className='flex items-center justify-between gap-3'>
              <Label htmlFor='video-prompt'>{t('Prompt')}</Label>
              <span className='text-muted-foreground text-xs tabular-nums'>
                {prompt.length}/2000
              </span>
            </div>
            <Textarea
              id='video-prompt'
              value={prompt}
              onChange={(event) => setPrompt(event.target.value.slice(0, 2000))}
              placeholder={t('Describe the scene, motion, camera, and mood')}
              className='min-h-32 resize-y leading-6'
            />
          </div>

          {model?.supportsImage && (
            <div className='space-y-2'>
              <Label htmlFor='video-image' className='flex items-center gap-2'>
                <ImagePlus className='text-muted-foreground size-4' />
                {t('Reference image URL')}
                <span className='text-muted-foreground font-normal'>
                  ({t('optional')})
                </span>
              </Label>
              <Input
                id='video-image'
                type='url'
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder='https://example.com/reference.jpg'
              />
            </div>
          )}

          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label>{t('Duration')}</Label>
              <Select
                value={String(duration)}
                onValueChange={(value) => value && setDuration(Number(value))}
              >
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {model?.durations.map((seconds) => (
                    <SelectItem key={seconds} value={String(seconds)}>
                      {seconds} {t('seconds')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>{t('Frame')}</Label>
              <Select
                value={size}
                onValueChange={(value) => value && setSize(value)}
              >
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {model?.sizes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>{t('Quality mode')}</Label>
              <Select
                value={mode}
                onValueChange={(value) => value && setMode(value)}
                disabled={!model?.modes}
              >
                <SelectTrigger className='h-9 w-full'>
                  <SelectValue placeholder={t('Automatic')} />
                </SelectTrigger>
                <SelectContent>
                  {(
                    model?.modes ?? [{ label: t('Automatic'), value: 'std' }]
                  ).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            size='lg'
            className='mt-1 w-full sm:w-fit sm:min-w-44'
            disabled={
              !model ||
              !prompt.trim() ||
              isSubmitting ||
              Boolean(task && !TERMINAL_STATUSES.has(task.status))
            }
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? (
              <LoaderCircle className='animate-spin' />
            ) : (
              <Play />
            )}
            {isSubmitting ? t('Submitting task') : t('Generate video')}
          </Button>
        </section>

        <section className='border-border bg-muted/20 flex min-h-[460px] min-w-0 flex-col overflow-hidden rounded-lg border'>
          <div className='border-border flex items-center justify-between gap-3 border-b px-4 py-3'>
            <div className='flex items-center gap-2'>
              <Film className='text-muted-foreground size-4' />
              <span className='text-sm font-medium'>
                {t('Generation result')}
              </span>
            </div>
            {task && <Badge variant={statusBadgeVariant}>{task.status}</Badge>}
          </div>

          {!task && (
            <div className='flex flex-1 flex-col items-center justify-center px-8 py-12 text-center'>
              <div className='border-border bg-background mb-5 grid size-14 place-items-center rounded-lg border shadow-sm'>
                <Film className='text-muted-foreground size-6' />
              </div>
              <h2 className='font-medium'>
                {t('Your video will appear here')}
              </h2>
              <p className='text-muted-foreground mt-2 max-w-sm text-sm leading-6'>
                {t(
                  'Generation runs asynchronously. You can keep this page open while the task is processed.'
                )}
              </p>
            </div>
          )}
          {task && isComplete && (
            <div className='flex flex-1 flex-col'>
              <div className='bg-black'>
                <video
                  key={contentUrl}
                  src={contentUrl}
                  controls
                  playsInline
                  className='aspect-video w-full object-contain'
                />
              </div>
              <div className='flex flex-1 flex-col gap-4 p-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircle2 className='mt-0.5 size-5 text-emerald-600' />
                  <div>
                    <p className='text-sm font-medium'>{t('Video is ready')}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      {model?.label} · {duration} {t('seconds')}
                    </p>
                  </div>
                </div>
                <div className='mt-auto flex flex-wrap gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      void navigator.clipboard.writeText(task.task_id)
                      toast.success(t('Task ID copied'))
                    }}
                  >
                    <Copy /> {t('Copy task ID')}
                  </Button>
                  <Button
                    variant='outline'
                    render={<a href={contentUrl} download />}
                  >
                    <Download /> {t('Download')}
                  </Button>
                  <Button variant='ghost' onClick={handleReset}>
                    <RotateCcw /> {t('Create another')}
                  </Button>
                </div>
              </div>
            </div>
          )}
          {task && !isComplete && (
            <div className='flex flex-1 flex-col items-center justify-center p-8 text-center'>
              <div
                className={cn(
                  'mb-5 grid size-14 place-items-center rounded-lg border',
                  isFailed
                    ? 'border-destructive/30 bg-destructive/10 text-destructive'
                    : 'border-border bg-background text-muted-foreground shadow-sm'
                )}
              >
                {statusIcon}
              </div>
              <h2 className='font-medium'>
                {isFailed ? t('Generation failed') : t('Generating video')}
              </h2>
              <p className='text-muted-foreground mt-2 max-w-sm text-sm leading-6'>
                {isFailed
                  ? task.fail_reason ||
                    t('The provider could not complete this task.')
                  : t(
                      'The provider is processing your request. Status updates automatically.'
                    )}
              </p>
              {!isFailed && (
                <div className='mt-6 w-full max-w-sm'>
                  <Progress value={progress} />
                  <div className='text-muted-foreground mt-2 flex justify-between text-xs tabular-nums'>
                    <span>{task.status}</span>
                    <span>{progress}%</span>
                  </div>
                </div>
              )}
              <div className='mt-6 flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => {
                    void navigator.clipboard.writeText(task.task_id)
                    toast.success(t('Task ID copied'))
                  }}
                >
                  <Copy /> {t('Copy task ID')}
                </Button>
                {isFailed && (
                  <Button variant='ghost' onClick={handleReset}>
                    <RotateCcw /> {t('Try again')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
