import {defineType, defineField, defineArrayMember} from 'sanity'
import {CogIcon} from '@sanity/icons'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'string',
      description: 'Appears in every footer and receives enquiries.',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact phone',
      type: 'string',
      description: 'Telephone number with country code.',
    }),
    defineField({
      name: 'copyrightHolder',
      title: 'Copyright holder',
      type: 'string',
      description: 'Name for the footer copyright notice.',
    }),
    defineField({
      name: 'funderName',
      title: 'Principal funder name',
      type: 'string',
    }),
    defineField({
      name: 'funderAcronym',
      title: 'Funder acronym',
      type: 'string',
    }),
    defineField({
      name: 'supporters',
      title: 'Funders and supporters',
      type: 'array',
      of: [defineArrayMember({type: 'supporter'})],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social accounts',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'platform', title: 'Platform name', type: 'string'}),
            defineField({name: 'url', title: 'Profile URL', type: 'url'}),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
