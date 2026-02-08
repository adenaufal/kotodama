import { Select, SelectOption } from '../Shared/Select';
import { ReplyTemplate, TweetTemplate } from '../../../constants/templates';

interface TemplateSelectorProps {
    templates: (ReplyTemplate | TweetTemplate)[];
    onSelect: (template: ReplyTemplate | TweetTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    templates,
    onSelect,
}) => {
    // Map templates to SelectOptions
    const options: SelectOption[] = templates.map(t => ({
        id: t.id,
        label: t.label,
        icon: <span>{t.icon}</span>,
        group: 'group' in t ? (t as any).category : undefined // Optional
    }));

    const handleSelect = (id: string) => {
        const template = templates.find(t => t.id === id);
        if (template) {
            onSelect(template);
        }
    };

    return (
        <div className="w-full px-5 py-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Quick Template
            </label>
            <Select
                options={options}
                value="" // Always reset selection for templates as they are actions
                onChange={handleSelect}
                placeholder="Choose a template..."
                className="w-full"
                searchable={true}
            />
        </div>
    );
};
