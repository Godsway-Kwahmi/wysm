import {defineType, defineField} from 'sanity'

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Coverage Item',
  type: 'object',
  fields: [
    defineField({
      name: 'outlet',
      title: 'Outlet name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Article link',
      type: 'url',
      validation: (rule) => rule.required().uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {title: 'outlet', subtitle: 'url'},
  },
})
