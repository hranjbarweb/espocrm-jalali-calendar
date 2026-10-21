<?php

namespace Espo\Modules\JalaliCalendar\Select;

use Espo\Core\Select\Where\DateTimeItemTransformer as DateTimeItemTransformerInterface;
use Espo\Core\Select\Where\Item;

class MeetingDateTimeItemTransformer implements DateTimeItemTransformerInterface
{
    public function __construct(
        private JalaliDateTimeItemTransformer $transformer
    ) {}

    public function transform(Item $item): Item
    {
        $type = $item->getType();
        $value = $item->getValue();
        $attribute = $item->getAttribute();
        $transformedItem = $this->transformer->transform($item);

        if (
            !in_array($attribute, ['dateStart', 'dateEnd']) ||
            in_array($type, [
                Item\Type::IS_NULL,
                Item\Type::EVER,
                Item\Type::IS_NOT_NULL,
            ])
        ) {
            return $transformedItem;
        }

        if (is_string($value)) {
            if (strlen($value) > 11) {
                return $transformedItem;
            }
        } elseif (is_array($value)) {
            foreach ($value as $valueItem) {
                if (is_string($valueItem) && strlen($valueItem) > 11) {
                    return $transformedItem;
                }
            }
        }

        $datePartRaw = [
            'attribute' => $attribute . 'Date',
            'type' => $type,
            'value' => $value,
        ];

        $data = $item->getData();

        if ($data instanceof Item\Data\DateTime) {
            $datePartRaw['timeZone'] = $data->getTimeZone();
        }

        return Item::fromRaw([
            'type' => Item::TYPE_OR,
            'value' => [
                $datePartRaw,
                [
                    'type' => Item::TYPE_AND,
                    'value' => [
                        $transformedItem->getRaw(),
                        [
                            'type' => Item\Type::IS_NULL,
                            'attribute' => $attribute . 'Date',
                        ],
                    ],
                ],
            ],
        ]);
    }
}
