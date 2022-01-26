<template>
    <QList bordered padding class="rounded-borders q-mb-md">
        <QItem>
            <QItemSection class="content">
                <QItemLabel class="text-h4">Touhou Lincher</QItemLabel>
                <p>
        Created by: Nikita Morozov (<CopiableLink link="https://github.com/SniperJoe">https://github.com/SniperJoe</CopiableLink>)<br>
        Original Touhou Launcher created by: Widdiful<br>
        This is a GNU/Linux port for Debian-based systems of Touhou Launcher's improved remake created by: David_Jones (DVN) (<CopiableLink link="https://github.com/David-JonesDVN">https://github.com/David-JonesDVN</CopiableLink>), with some Linux-specific additional features.
                </p>
                <p>
        This is a nonprofit project developed independently by a fan<br>
        Touhou belongs to Team Shanghai Alice
                </p>
                <p>
        Feel free to propose improvements and fixes!<br>
        You can propose via GitHub (<CopiableLink link="https://github.com/SniperJoe">https://github.com/SniperJoe</CopiableLink>) or <CopiableLink link="mailto:mornickmylo@gmail.com">by email</CopiableLink><br>
                </p>
            </QItemSection>
        </QItem>
    </QList>
</template>

<script lang="ts" setup>
import CopiableLink from './CopiableLink.vue';

</script>

<style lang="scss" scoped>
.content p{
 padding: 20px 0 0 5px;
}
</style>
