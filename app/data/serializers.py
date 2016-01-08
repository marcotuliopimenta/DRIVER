from ashlar import serializers
from ashlar import serializer_fields

from django.conf import settings


class DetailsReadOnlyRecordSerializer(serializers.RecordSerializer):
    """Serialize records with only read-only fields included"""
    data = serializer_fields.MethodTransformJsonField('filter_details_only')

    def filter_details_only(self, key, value):
        """Return only the details object and no other related info"""
        if key in settings.READ_ONLY_FIELDS:
            return key, value
        else:
            raise serializer_fields.DropJsonKeyException


class DetailsReadOnlyRecordSchemaSerializer(serializers.RecordSchemaSerializer):
    """Serialize Schema with only read-only fields included"""
    schema = serializer_fields.MethodTransformJsonField('make_read_only_schema')

    def make_read_only_schema(self, key, value):
        if key != 'properties' and key != 'definitions':
            return key, value

        # If we're looking at properties/definitions, remove everything that isn't read-only
        new_value = {}
        for k in value.viewkeys():
            if k in settings.READ_ONLY_FIELDS:
                new_value[k] = value[k]
        return key, new_value