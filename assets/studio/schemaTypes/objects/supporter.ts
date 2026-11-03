import {defineType, defineField} from 'sanity'

export const supporter = defineType({
  name: 'supporter',
  title: 'Supporter / Funder',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Funder or institution name',
      type: 'string',
      description: 'Full name without abbreviation (as required by funding bodies).',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Website',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
    defineField({
      name: 'logo',
      title: 'Logo mark (optional)',
      type: 'image',
      fields: [defineField({name: 'alt', title: 'Alternative text', type: 'string'})],
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'url', media: 'logo'},
  },
})
