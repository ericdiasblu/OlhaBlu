import * as Select from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'

type FilterSelectProps<Value extends string> = {
  id: string
  label: string
  value: Value
  options: { value: Value; label: string }[]
  onChange: (value: Value) => void
}

export function FilterSelect<Value extends string>({ id, label, value, options, onChange }: FilterSelectProps<Value>) {
  return <div className="filter-select">
    <label htmlFor={id}>{label}</label>
    <Select.Root value={value} onValueChange={next => {
      const option = options.find(item => item.value === next)
      if (option) onChange(option.value)
    }}>
      <Select.Trigger id={id} className="filter-select-trigger">
        <Select.Value />
        <Select.Icon asChild><ChevronDown size={17} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="filter-select-menu" position="popper" sideOffset={6} collisionPadding={12}>
          <Select.ScrollUpButton className="filter-select-scroll"><ChevronUp size={16} /></Select.ScrollUpButton>
          <Select.Viewport className="filter-select-options">
            {options.map(option => <Select.Item className="filter-select-option" value={option.value} key={option.value}>
              <Select.ItemText>{option.label}</Select.ItemText>
              <Select.ItemIndicator asChild><Check size={16} aria-hidden="true" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className="filter-select-scroll"><ChevronDown size={16} /></Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>
}
