import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PricingSection from '@/components/PricingSection'

const meta = {
  title: 'CBDemo/PricingSection',
  component: PricingSection,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PricingSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
