import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Suspense } from 'react'
import SuccessCard from '@/components/SuccessCard'

const meta = {
  title: 'CBDemo/SuccessCard',
  component: SuccessCard,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <Suspense>
        <Story />
      </Suspense>
    ),
  ],
} satisfies Meta<typeof SuccessCard>

export default meta
type Story = StoryObj<typeof meta>

// With order ID and email (simulates a successful ChargeBee redirect)
export const WithParams: Story = {
  parameters: {
    nextjs: {
      navigation: {
        searchParams: {
          id: 'hp_Abc123XyzDemoOrder',
          email: 'osmar@osmarpetry.dev',
        },
      },
    },
  },
}

// Without params (fallback — no query string)
export const NoParams: Story = {
  parameters: {
    nextjs: {
      navigation: {
        searchParams: {},
      },
    },
  },
}
