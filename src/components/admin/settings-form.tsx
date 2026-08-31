import { Card } from "@/components/admin/admin-ui";
import {
  BlockListField,
  DraggableRepeaterField,
  GroupedListField,
  LinkGroupField,
  LinkListField,
  Label,
  SelectField,
  StringListField,
  TextArea,
  TextField,
  Toggle,
} from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-upload";
import {
  asBlocks,
  asGroups,
  asLinkGroups,
  asLinks,
  asObject,
  asRows,
  asText,
  asTextList,
  type SettingsField,
  type SettingsObject,
  type SettingsSchema,
} from "@/lib/content-schema";

export function mergeSetting(stored: unknown, edited: SettingsObject): SettingsObject {
  return { ...asObject(stored), ...edited };
}

/** Stored value on top of the shipped defaults, so untouched fields open pre-filled. */
export function hydrateSetting(defaults: unknown, stored: unknown): SettingsObject {
  return { ...asObject(defaults), ...asObject(stored) };
}

export function SettingsSections({
  schema,
  value,
  onChange,
}: {
  schema: SettingsSchema;
  value: SettingsObject;
  onChange: (next: SettingsObject) => void;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });

  return (
    <div className="flex flex-col gap-4">
      {schema.sections.map((section) => (
        <Card key={section.title} title={section.title} description={section.description}>
          {section.fields.map((field) => (
            <FieldControl
              key={field.key}
              field={field}
              value={value[field.key]}
              onChange={(v) => set(field.key, v)}
            />
          ))}
        </Card>
      ))}
    </div>
  );
}

export function FieldControl({
  field,
  value,
  onChange,
}: {
  field: SettingsField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "text":
      return (
        <TextField
          label={field.label}
          hint={field.hint}
          placeholder={field.placeholder}
          value={asText(value)}
          onChange={onChange}
        />
      );
    case "textarea":
      return (
        <TextArea
          label={field.label}
          hint={field.hint}
          rows={field.rows}
          plain={field.plain}
          value={asText(value)}
          onChange={onChange}
        />
      );
    case "image":
      return <ImageField label={field.label} hint={field.hint} value={asText(value)} onChange={onChange} />;
    case "select":
      return (
        <SelectField
          label={field.label}
          hint={field.hint}
          value={asText(value)}
          options={field.options}
          onChange={onChange}
        />
      );
    case "list":
      return (
        <StringListField
          label={field.label}
          hint={field.hint}
          multiline={field.multiline}
          placeholder={field.placeholder}
          values={asTextList(value)}
          onChange={onChange}
        />
      );
    case "toggles": {
      const off = asTextList(value);
      return (
        <div>
          <Label hint={field.hint}>{field.label}</Label>
          <div className="flex flex-col gap-3 rounded-[10px] border border-rule bg-paper px-4 py-3.5">
            {field.options.map((option) => (
              <Toggle
                key={option.value}
                label={option.label}
                hint={option.hint}
                checked={!off.includes(option.value)}
                onChange={(on) =>
                  onChange(
                    on
                      ? off.filter((v) => v !== option.value)
                      : [...off.filter((v) => v !== option.value), option.value],
                  )
                }
              />
            ))}
          </div>
        </div>
      );
    }
    case "links":
      return (
        <LinkListField
          label={field.label}
          hint={field.hint}
          addLabel={field.addLabel}
          values={asLinks(value)}
          onChange={onChange}
        />
      );
    case "linkGroups":
      return <LinkGroupField label={field.label} hint={field.hint} values={asLinkGroups(value)} onChange={onChange} />;
    case "blocks":
      return <BlockListField label={field.label} hint={field.hint} values={asBlocks(value)} onChange={onChange} />;
    case "groups":
      return (
        <GroupedListField
          label={field.label}
          hint={field.hint}
          icons={field.icons}
          values={asGroups(value)}
          onChange={onChange}
        />
      );
    case "rows":
      return (
        <DraggableRepeaterField
          label={field.label}
          hint={field.hint}
          title={field.title}
          columns={field.columns}
          values={asRows(value)}
          blank={() => ({ ...field.blank })}
          onChange={onChange}
        />
      );
  }
}
